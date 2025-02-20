import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, UpdateDateColumn, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity()
export class Todo {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    description: string;

    @Column({ default: false })
    completed: boolean;

    @UpdateDateColumn()
    updatedAt?: Date;

    @CreateDateColumn()
    createdAt?: Date;

    @ManyToOne(() => User, (user) => user.todoLists, { onDelete: 'CASCADE' })
    user: User;
}
