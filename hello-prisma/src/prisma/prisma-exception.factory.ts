import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
// https://www.prisma.io/docs/reference/api-reference/error-reference#error-codes

//TODO: Exception Handling
@Injectable()
export class PrismaExceptionFactory {
  throw(e: Prisma.PrismaClientKnownRequestError) {
    if (e.code === 'P2000') {
      throw new BadRequestException(`The provided value for the column is too long for the column's type column: ${e.meta}`);
    } else if (e.code === 'P2001') {

    } else if (e.code === 'P2002') {

    } else if (e.code === 'P2003') {

    } else if (e.code === 'P2004') {

    } else if (e.code === 'P2005') {

    } else if (e.code === 'P2006') {

    } else if (e.code === 'P2008') {

    } else if (e.code === 'P2009') {

    } else if (e.code === 'P2010') {

    } else if (e.code === 'P2011') {

    } else if (e.code === 'P2012') {

    } else if (e.code === 'P2013') {

    } else if (e.code === 'P2014') {

    } else if (e.code === 'P2015') {

    } else if (e.code === 'P2016') {

    } else if (e.code === 'P2017') {

    } else if (e.code === 'P2018') {

    } else if (e.code === 'P2019') {

    } else if (e.code === 'P2020') {

    } else if (e.code === 'P2021') {

    } else if (e.code === 'P2022') {

    } else if (e.code === 'P2023') {

    } else if (e.code === 'P2024') {

    } else if (e.code === 'P2025') {

    } else if (e.code === 'P2026') {

    } else if (e.code === 'P2027') {

    } else if (e.code === 'P2028') {

    } else if (e.code === 'P2029') {

    } else if (e.code === 'P2030') {

    } else {
      throw new InternalServerErrorException();
    }
  }
}