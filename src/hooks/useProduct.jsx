import products from "@/libs/products";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const useProduct = ({ id }) => {
    const queryClient = useQueryClient();
    
    const getProduct = useQuery({
        queryKey: ["products", id],
        queryFn: () => products.getById(id),
    });

    const getCombo = useQuery({
        queryKey: ["combos", id],
        queryFn: () => products.getCombo(id),
    });

    

    return {
        getProduct,
        getCombo,
    };
}

export default useProduct;