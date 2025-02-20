import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { TodoService } from './todo.service';
import { Todo } from './todo.entity';

describe('TodoService', () => {
    let service: TodoService;
    let repository: Repository<Todo>;

    const mockTodo = {
        id: 1,
        title: 'Test Todo',
        description: 'Test Description',
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        delete: jest.fn(),
        query: jest.fn(),
        manager: {
            transaction: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TodoService,
                {
                    provide: getRepositoryToken(Todo),
                    useValue: mockRepository,
                },
                {
                    provide: DataSource,
                    useValue: {
                        createQueryRunner: jest.fn().mockReturnValue({
                            connect: jest.fn(),
                            startTransaction: jest.fn(),
                            commitTransaction: jest.fn(),
                            rollbackTransaction: jest.fn(),
                            release: jest.fn(),
                        }),
                    },
                },
            ],
        }).compile();

        service = module.get<TodoService>(TodoService);
        repository = module.get<Repository<Todo>>(getRepositoryToken(Todo));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should return an array of todos with MySQL date formats', async () => {
            const mockTodos = [
                { ...mockTodo, createdAt: new Date('2024-01-01') },
                { ...mockTodo, id: 2, createdAt: new Date('2024-01-02') },
            ];

            mockRepository.find.mockResolvedValue(mockTodos);

            const result = await service.findAll();

            expect(result).toEqual(mockTodos);
            expect(mockRepository.find).toHaveBeenCalled();

            result.forEach(todo => {
                expect(todo.createdAt).toBeInstanceOf(Date);
                expect(todo.updatedAt).toBeInstanceOf(Date);
            });
        });

        it('should handle MySQL connection errors', async () => {
            mockRepository.find.mockRejectedValue(new Error('ER_CON_COUNT_ERROR'));

            await expect(service.findAll()).rejects.toThrow();
        });
    });

    describe('findOne', () => {
        it('should return a single todo with MySQL date formats', async () => {
            mockRepository.findOne.mockResolvedValue(mockTodo);

            const result = await service.findOne(1);

            expect(result).toEqual(mockTodo);
            expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
            expect(result.createdAt).toBeInstanceOf(Date);
            expect(result.updatedAt).toBeInstanceOf(Date);
        });

        it('should handle MySQL duplicate entry errors', async () => {
            const mysqlError = new Error('ER_DUP_ENTRY');
            mysqlError.name = 'QueryFailedError';
            mockRepository.findOne.mockRejectedValue(mysqlError);

            await expect(service.findOne(1)).rejects.toThrow();
        });
    });

    describe('create', () => {
        it('should create a new todo with MySQL timestamp', async () => {
            const createTodoDto = {
                title: 'New Todo',
                description: 'New Description',
                completed: false,
            };

            const savedTodo = {
                ...createTodoDto,
                id: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockRepository.create.mockReturnValue(createTodoDto);
            mockRepository.save.mockResolvedValue(savedTodo);

            const result = await service.create(createTodoDto);

            expect(result).toEqual(savedTodo);
            expect(result.createdAt).toBeInstanceOf(Date);
            expect(result.updatedAt).toBeInstanceOf(Date);
        });

        it('should handle MySQL constraint violations', async () => {
            const createTodoDto = {
                title: 'A'.repeat(256),
                description: 'Test',
            };

            mockRepository.save.mockRejectedValue(new Error('ER_DATA_TOO_LONG'));

            await expect(service.create(createTodoDto)).rejects.toThrow();
        });
    });

    describe('update', () => {
        it('should update a todo and handle MySQL timestamp', async () => {
            const updateTodoDto = { title: 'Updated Todo' };
            const updatedAt = new Date();

            mockRepository.findOne.mockResolvedValue(mockTodo);
            mockRepository.save.mockResolvedValue({
                ...mockTodo,
                ...updateTodoDto,
                updatedAt: updatedAt,
            });

            const result = await service.update(1, updateTodoDto);

            expect(result.title).toBe(updateTodoDto.title);
            expect(result.updatedAt).toBeInstanceOf(Date);
            expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(mockTodo.updatedAt.getTime());
        });
    });

    describe('delete', () => {
        it('should handle MySQL foreign key constraints', async () => {
            mockRepository.delete.mockRejectedValue(new Error('ER_ROW_IS_REFERENCED'));

            await expect(service.delete(1)).rejects.toThrow();
        });

        it('should successfully delete when no constraints are violated', async () => {
            mockRepository.delete.mockResolvedValue({ affected: 1 });

            await service.delete(1);

            expect(mockRepository.delete).toHaveBeenCalledWith(1);
        });
    });
});