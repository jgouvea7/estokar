import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // GET /products — autenticado (somente produtos do usuário)
  @Get()
  findAll(@CurrentUser('id') requesterId: string) {
    return this.productsService.findAll(requesterId);
  }

  // GET /products/:id — autenticado
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') requesterId: string,
  ) {
    return this.productsService.findOne(id, requesterId);
  }

  // POST /products — requer autenticação (userId vem do JWT)
  @Post()
  create(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser('id') requesterId: string,
  ) {
    return this.productsService.create(createProductDto, requesterId);
  }

  // PATCH /products/:id — requer autenticação + ser o dono
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser('id') requesterId: string,
  ) {
    return this.productsService.update(id, updateProductDto, requesterId);
  }

  // DELETE /products/:id — requer autenticação + ser o dono
  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') requesterId: string,
  ) {
    return this.productsService.remove(id, requesterId);
  }
}
