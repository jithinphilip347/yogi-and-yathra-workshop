import products from "@/libs/products";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const useProduct = ({ id, type }) => {
    const productQuery = useQuery({
        queryKey: ["product", id],
        queryFn: () => products.getById(id),
        enabled: !!id && type === "normal",
    });

    const comboQuery = useQuery({
        queryKey: ["combo", id],
        queryFn: () => products.getCombo(id),
        enabled: !!id && type === "combo",
    });

    return {
        productQuery: type === "combo" ? comboQuery : productQuery,
    };
};

export default useProduct;