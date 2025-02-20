"use client"

import React, { useState } from 'react';
import {
    Container,
    Paper,
    TextField,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Checkbox,
    IconButton,
    Typography,
    Box,
    Button,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { useQuery } from '@tanstack/react-query';
import { getTodoItems } from './requests';

interface TodoItem {
    id: number;
    title: string;
    description: string;
    completed: boolean;
    isEditing: boolean;
}

const Todo = () => {
    const [todos, setTodos] = useState<TodoItem[]>([]);
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');

    const handleAddTodo = () => {
        if (newTitle.trim() && newDescription.trim()) {
            setTodos([
                ...todos,
                {
                    id: Date.now(),
                    title: newTitle.trim(),
                    description: newDescription.trim(),
                    completed: false,
                    isEditing: false,
                },
            ]);
            setNewTitle('');
            setNewDescription('');
        }
    };

    const handleToggleTodo = (id: number) => {
        setTodos(
            todos.map((todo) =>
                todo.id === id ? { ...todo, completed: !todo.completed } : todo
            )
        );
    };

    const handleDeleteTodo = (id: number) => {
        setTodos(todos.filter((todo) => todo.id !== id));
    };

    const handleEditTodo = (id: number) => {
        setTodos(
            todos.map((todo) =>
                todo.id === id ? { ...todo, isEditing: !todo.isEditing } : todo
            )
        );
    };

    const handleSaveTodo = (id: number, title: string, description: string) => {
        setTodos(
            todos.map((todo) =>
                todo.id === id ? { ...todo, title, description, isEditing: false } : todo
            )
        );
    };

    const { data } = useQuery({
        queryKey: ['getTodo'],
        queryFn: getTodoItems
    })

    console.log("data", data)

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom align="center">
                    Lista de Tarefas
                </Typography>
                <Paper elevation={3} sx={{ p: 2 }}>
                    <TextField
                        fullWidth
                        label="Título"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Descrição"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        onClick={handleAddTodo}
                    >
                        Adicionar Tarefa
                    </Button>
                    <List>
                        {data?.map((todo: any) => (
                            <ListItem
                                key={todo.id}
                                secondaryAction={
                                    <>
                                        <IconButton onClick={() => handleEditTodo(todo.id)}>
                                            {todo.isEditing ? <SaveIcon /> : <EditIcon />}
                                        </IconButton>
                                        <IconButton onClick={() => handleDeleteTodo(todo.id)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </>
                                }
                                sx={{ bgcolor: 'background.paper', mb: 1, borderRadius: 1 }}
                            >
                                <ListItemIcon>
                                    <Checkbox
                                        edge="start"
                                        checked={todo.completed}
                                        onChange={() => handleToggleTodo(todo.id)}
                                    />
                                </ListItemIcon>
                                {todo.isEditing ? (
                                    <Box sx={{ width: '100%' }}>
                                        <TextField
                                            fullWidth
                                            label="Título"
                                            defaultValue={todo.title}
                                            onBlur={(e) => handleSaveTodo(todo.id, e.target.value, todo.description)}
                                            sx={{ mb: 1 }}
                                        />
                                        <TextField
                                            fullWidth
                                            label="Descrição"
                                            defaultValue={todo.description}
                                            onBlur={(e) => handleSaveTodo(todo.id, todo.title, e.target.value)}
                                        />
                                    </Box>
                                ) : (
                                    <ListItemText
                                        primary={todo.title}
                                        secondary={todo.description}
                                        sx={{
                                            textDecoration: todo.completed ? 'line-through' : 'none',
                                            color: todo.completed ? 'text.secondary' : 'text.primary',
                                        }}
                                    />
                                )}
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            </Box>
        </Container>
    );
};

export default Todo;
