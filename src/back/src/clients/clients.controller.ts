import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  Request,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { AuthGuard } from '@nestjs/passport';
import { UpdateClientDto } from './dto/update-client.dto';
import { Response } from 'express';

@Controller('clients')
@UseGuards(AuthGuard('jwt'))
export class ClientsController {
  constructor(private clientsService: ClientsService) { }

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
}
