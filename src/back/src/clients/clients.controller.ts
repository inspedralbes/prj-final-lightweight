import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  Res,
  HttpException,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { AuthGuard } from '@nestjs/passport';
import { UpdateClientDto } from './dto/update-client.dto';
import { Response } from 'express';

@Controller('clients')
@UseGuards(AuthGuard('jwt'))
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Get()
  async getClients(@Request() req, @Res() res: Response) {
    try {
      const coachId = req.user.userId;
      const clients = await this.clientsService.getClients(coachId);
      res.json(clients);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch clients',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // POST /clients/invite-by-user — COACH invita a un cliente por username o email
  // IMPORTANTE: ruta estática ANTES de la dinámica :id
  @Post('invite-by-user')
  async inviteByUser(
    @Body() body: { usernameOrEmail: string },
    @Request() req,
    @Res() res: Response,
  ) {
    try {
      const coachId = req.user.userId;
      const result = await this.clientsService.inviteByUser(
        coachId,
        body.usernameOrEmail,
      );
      res.status(HttpStatus.CREATED).json(result);
    } catch (error) {
      if (error.message === 'User not found') {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      if (error.message === 'The user is not a client') {
        throw new HttpException(
          'The user is not a client',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (error.message === 'This client is already linked to a coach') {
        throw new HttpException(
          'This client is already linked to a coach',
          HttpStatus.CONFLICT,
        );
      }
      if (error instanceof ForbiddenException) {
        throw new HttpException(error.message, HttpStatus.FORBIDDEN);
      }
      throw new HttpException(
        'Failed to send invitation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // GET /clients/me — Cliente autenticado consulta si tiene coach asignado
  // IMPORTANTE: ruta estática ANTES de la dinámica :id
  @Get('me')
  async getMyCoach(@Request() req, @Res() res: Response) {
    try {
      const clientId = req.user.userId;
      const result = await this.clientsService.getMyCoach(clientId);
      res.json(result);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch coach info',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async getClientById(
    @Param('id') clientId: string,
    @Request() req,
    @Res() res: Response,
  ) {
    try {
      const coachId = req.user.userId;
      const client = await this.clientsService.getClientById(
        parseInt(clientId),
        coachId,
      );
      res.json(client);
    } catch (error) {
      if (error.message === 'Client not found') {
        throw new HttpException('Client not found', HttpStatus.NOT_FOUND);
      }
      if (error.message.includes('permission')) {
        throw new HttpException(
          'Forbidden: You do not have permission to view this client',
          HttpStatus.FORBIDDEN,
        );
      }
      throw new HttpException(
        'Failed to fetch client',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  async updateClient(
    @Param('id') clientId: string,
    @Body() updateClientDto: UpdateClientDto,
    @Request() req,
    @Res() res: Response,
  ) {
    try {
      const coachId = req.user.userId;
      const updated = await this.clientsService.updateClient(
        parseInt(clientId),
        coachId,
        updateClientDto,
      );
      res.json(updated);
    } catch (error) {
      if (error.message === 'Client not found') {
        throw new HttpException('Client not found', HttpStatus.NOT_FOUND);
      }
      if (error.message.includes('permission')) {
        throw new HttpException(
          'Forbidden: You can only edit your own clients',
          HttpStatus.FORBIDDEN,
        );
      }
      throw new HttpException(
        'Failed to update client',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // DELETE /clients/me/unlink — CLIENTE elimina su asociación con el coach
  // IMPORTANTE: ruta estática ANTES de :id/unlink
  @Delete('me/unlink')
  async unlinkFromCoach(@Request() req, @Res() res: Response) {
    try {
      const clientId = req.user.userId;
      await this.clientsService.unlinkFromCoach(clientId);
      res.status(HttpStatus.NO_CONTENT).send();
    } catch (error) {
      if (error.message === 'You are not linked to any coach') {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException(
        'Failed to unlink from coach',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // DELETE /clients/:id/unlink — COACH elimina la asociación con un cliente
  @Delete(':id/unlink')
  async unlinkClient(
    @Param('id') clientId: string,
    @Request() req,
    @Res() res: Response,
  ) {
    try {
      const coachId = req.user.userId;
      await this.clientsService.unlinkClient(coachId, parseInt(clientId));
      res.status(HttpStatus.NO_CONTENT).send();
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw new HttpException(error.message, HttpStatus.FORBIDDEN);
      }
      if (error.message === 'Client not found') {
        throw new HttpException('Client not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        'Failed to unlink client',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
