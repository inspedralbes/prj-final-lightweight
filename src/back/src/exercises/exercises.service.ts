import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExerciseService {
  private readonly logger = new Logger(ExerciseService.name);

  private readonly GITHUB_API =
    'https://api.github.com/repos/wrkout/exercises.json/contents/exercises';

  private readonly RAW_BASE =
    'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises';

  constructor(private prisma: PrismaService) {}

  async getAllExercises() {
    return this.prisma.exerciseCatalog.findMany();
  }

  async importAllExercises() {
    // Import logic would go here
    this.logger.log('Importing exercises from GitHub...');

    const foldersRes = await fetch(this.GITHUB_API);

    if (!foldersRes.ok) {
      this.logger.error(
        `Failed to fetch exercises from GitHub: ${foldersRes.status} ${foldersRes.statusText}`,
      );
      throw new InternalServerErrorException(
        'Failed to fetch exercises from GitHub',
      );
    }
    const folders = await foldersRes.json();

    for (const folder of folders) {
      const folderName = folder.name;
      try {
        const exercisesRes = await fetch(
          `${this.RAW_BASE}/${folderName}/exercise.json`,
        );

        if (!exercisesRes.ok) {
          this.logger.error(
            `Failed to fetch exercises for folder ${folderName}: ${exercisesRes.status} ${exercisesRes.statusText}`,
          );
          continue; // Skip this folder and continue with the next one
        }

        const exerciseData = await exercisesRes.json();

        let imgUrl: string[] = [];

        try {
          const imagesRes = await fetch(
            `${this.GITHUB_API}/${folderName}/images`,
          );
          if (imagesRes.ok) {
            const imagesData = await imagesRes.json();

            imgUrl = imagesData.map((img: any) => img.download_url);
          }
        } catch (error) {
          this.logger.warn(
            `No images found for folder ${folderName}, skipping image URLs.`,
          );
        }

        const formattedExercises = {
          name: exerciseData.name || folderName,
          description: Array.isArray(exerciseData.instructions)
            ? exerciseData.instructions.join('\n')
            : '',
          // imgUrl: imageUrl, // Assign image URL if available, otherwise null
        };

        await this.prisma.exerciseCatalog.upsert({
          where: { name: formattedExercises.name },
          update: {
            description: formattedExercises.description,
          },
          create: formattedExercises,
        });

        this.logger.log(`Imported exercises for folder ${folderName}`);
      } catch (error) {
        this.logger.error(
          `Error importing exercises for folder ${folderName}: ${error.message}`,
        );
      }
    }
    this.logger.log('Finished importing exercises from GitHub');
  }
}
