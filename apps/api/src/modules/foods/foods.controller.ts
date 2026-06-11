import { Controller, Get, Param, Query } from '@nestjs/common';
import { FoodCategory } from '@prisma/client';
import { FoodsService } from './foods.service';

@Controller('foods')
export class FoodsController {
  constructor(private foods: FoodsService) {}

  /** GET /foods?q=قورمه&category=MAIN_DISH */
  @Get()
  search(@Query('q') q?: string, @Query('category') category?: FoodCategory) {
    return this.foods.search(q, category);
  }

  @Get(':id')
  byId(@Param('id') id: string) {
    return this.foods.byId(id);
  }

  /** GET /foods/:id/impact?servings=1.5 — تحلیل تاثیر روی قند */
  @Get(':id/impact')
  impact(@Param('id') id: string, @Query('servings') servings?: string) {
    return this.foods.analyzeImpact(id, servings ? Number(servings) : 1);
  }
}
