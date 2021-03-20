import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const isFirstRender = useRef(true); 
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    return storagedCart ? JSON.parse(storagedCart) : [];
  });

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
  }, [cart]);

  const addProduct = async (productId: number) => {
    const productCartId = cart.findIndex(product => product.id === productId);

    try {
      const { data: productStock } = await api.get<Stock>(`stock/${productId}`);

      if (productCartId !== -1) {
        const availableStockAmount = productStock.amount - cart[productCartId].amount;
        if (availableStockAmount <= 0) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        cart[productCartId].amount += 1;
        setCart([...cart]);
      } else {
        if (productStock.amount <= 0) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        const { data: selectedProduct } = await api.get<Product>(`products/${productId}`);
        selectedProduct.amount = 1;
        setCart([...cart, selectedProduct]);
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    if (amount <= 0) {
      return;
    }

    try {
      const { data: productStock } = await api.get<Stock>(`stock/${productId}`);
      if (amount > productStock.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const productIndex = cart.findIndex(product => product.id === productId);
      if (productIndex === -1) {
        throw new Error('Produto não encontrado');
      }

      cart[productIndex].amount = amount;
      setCart([...cart]);
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
