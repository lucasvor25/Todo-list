import { Controller, Get, Post, Put, Delete, Param, Body, Request, UseGuards } from '@nestjs/common';
import { TodoService } from './todo.service';
import { Todo } from './todo.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('todo')
export class TodoController {
    constructor(private readonly todoService: TodoService) { }

    @Get('getItem')
    @UseGuards(JwtAuthGuard)
    async findAll(@Request() req): Promise<Todo[]> {
        return this.todoService.findAll(req.user.id);
    }

    @Get('getItemById/:id')
    @UseGuards(JwtAuthGuard)
    async findOne(@Request() req, @Param('id') id: number): Promise<Todo> {
        return this.todoService.findOne(req.user.id, id);
    }

    @Post('createItem')
    @UseGuards(JwtAuthGuard)
    async create(@Request() req, @Body() todo: Partial<Todo>): Promise<Todo> {
        return this.todoService.create(req.user.id, todo);
    }

    @Put('editItem/:id')
    @UseGuards(JwtAuthGuard)
    async update(@Request() req, @Param('id') id: number, @Body() todo: Partial<Todo>): Promise<Todo> {
        return this.todoService.update(req.user.id, id, todo);
    }

    @Delete('deleteItem/:id')
    @UseGuards(JwtAuthGuard)
    async delete(@Request() req, @Param('id') id: number): Promise<void> {
        return this.todoService.delete(req.user.id, id);
    }
}
