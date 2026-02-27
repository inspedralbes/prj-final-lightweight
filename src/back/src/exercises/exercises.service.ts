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
          category: exerciseData.category || null,
          primaryMuscle: exerciseData.primaryMuscles || [],
          secondaryMuscle: exerciseData.secondaryMuscles || [],
          forceType: exerciseData.force || null,
          level: exerciseData.level || null,
          mechanic: exerciseData.mechanic || null,
          equipment: exerciseData.equipment || null,
          // imgUrl: imageUrl, // Assign image URL if available, otherwise null
        };

        await this.prisma.exerciseCatalog.upsert({
          where: { name: formattedExercises.name },
          update: {
            description: formattedExercises.description,
            category: formattedExercises.category,
            primaryMuscle: formattedExercises.primaryMuscle,
            secondaryMuscle: formattedExercises.secondaryMuscle,
            forceType: formattedExercises.forceType,
            level: formattedExercises.level,
            mechanic: formattedExercises.mechanic,
            equipment: formattedExercises.equipment,
            // Anira la imatge
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

  async searchExercises(filters: any) {
    this.logger.log(`searchExercises filters: ${JSON.stringify(filters)}`);
    const {
      search,
      level,
      category,
      force,
      mechanic,
      equipment,
      primaryMuscle,
      page = 1,
      limit = 20,
    } = filters;

    return this.prisma.exerciseCatalog.findMany({
      where: {
        ...(search && {
          name: { mode: 'insensitive', contains: search },
        }),
        ...(level && { level }),
        ...(category && {
          category: { mode: 'insensitive', equals: category },
        }),
        ...(force && { forceType: { mode: 'insensitive', equals: force } }),
        ...(mechanic && {
          mechanic: { mode: 'insensitive', equals: mechanic },
        }),
        ...(equipment && {
          equipment: { mode: 'insensitive', equals: equipment },
        }),
        ...(primaryMuscle && { primaryMuscle: { hasSome: [primaryMuscle] } }),
      },
      skip: (page - 1) * limit,
      take: Number(limit),
    });
  }
}
