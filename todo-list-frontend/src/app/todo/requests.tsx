import { API_URL } from "../api/api";

export const getTodoItems = async () => {
    const response = await fetch(`${API_URL}/todo/getItem`);

    if (!response.ok) {
        throw new Error("Erro ao buscar os itens");
    }

    return response.json();
};