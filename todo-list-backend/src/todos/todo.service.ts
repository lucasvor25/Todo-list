import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Todo } from './todo.entity';
import { User } from 'src/users/user.entity';

@Injectable()
export class TodoService {
    constructor(
        @InjectRepository(Todo)
        private readonly todoRepository: Repository<Todo>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    async findAll(userId: number): Promise<Todo[]> {
        console.log("teste")
        return this.todoRepository.find({ where: { user: { id: userId } } });
    }

    async findOne(userId: number, id: number): Promise<Todo> {
        const todo = await this.todoRepository.findOne({ where: { id, user: { id: userId } } });
        if (!todo) {
            throw new NotFoundException(`Todo with ID ${id} not found or not owned by you`);
        }
        return todo;
    }

    async create(userId: number, todo: Partial<Todo>): Promise<Todo> {
        const user = await this.userRepository.findOne({ where: { id: userId } });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const newTodo = this.todoRepository.create({ ...todo, user });
        return this.todoRepository.save(newTodo);
    }

    async update(userId: number, id: number, todo: Partial<Todo>): Promise<Todo> {
        const existingTodo = await this.findOne(userId, id);
        const updatedTodo = Object.assign(existingTodo, todo);
        return this.todoRepository.save(updatedTodo);
    }

    async delete(userId: number, id: number): Promise<void> {
        const todo = await this.findOne(userId, id);
        await this.todoRepository.remove(todo);
    }
}
