import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { KarmaResponseInterface } from '../interface/karma-reponse.interface';
import { AxiosError } from 'axios';

@Injectable()
export class AdjutorService {
  private readonly logger = new Logger(AdjutorService.name);
  constructor(private readonly httpService: HttpService) {}

  /**
   * Check Karma for Users
   * @param email
   * @returns Boolean
   */
  async checkKarma(email: string): Promise<boolean> {
    try {
      const response =
        await this.httpService.axiosRef.get<KarmaResponseInterface>(
          `/verification/karma/:${email}`,
        );

      // If a record is found for the user in the karma records, return true
      // This means the user has been blacklisted
      const data = response.data;
      if (
        Object.keys(data).length > 0 &&
        data.status === 'success' &&
        data.message === 'Successful'
      ) {
        return true; // User is blacklisted
      }

      return false;
    } catch (error) {
      if (error instanceof AxiosError) {
        const status =
          error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
        const message = error.response?.data?.message || error.message;

        this.logger.error(`Karma Check Failed: ${message}`);

        throw new HttpException(
          {
            status: 'error',
            message:
              'An unexpected error occurred please check your connection and try again',
          },
          status,
        );
      }

      const genericError =
        error instanceof Error ? error.message : 'An unexpected error occurred';
      this.logger.error(`Unexpected Error: ${genericError}`);

      throw new HttpException(
        {
          status: 'error',
          message:
            'An unexpected error occurred please check your connection and try again',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
