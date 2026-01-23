import productApiClient from "@/services/productApi";

const products = {
    getById: async (id) => {
        const response = await productApiClient.get(`products/${id}`);
        return response.data;
    },
    getCombo: async (id) => {
        const response = await productApiClient.get(`combo-products/${id}`);
        return response.data;
    },
}

export default products;