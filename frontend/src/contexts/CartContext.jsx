/**
 * Cart Context
 * Shopping cart state management
 * Pattern: React Context + Reducer
 */
import React, { createContext, useContext, useReducer, useCallback } from 'react';

// Action types
const CART_ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
};

// Initial state
const initialState = {
  items: [],
};

/**
 * Cart reducer
 * @param {Object} state - Current state
 * @param {Object} action - Action object
 * @returns {Object} New state
 */
function cartReducer(state, action) {
  switch (action.type) {
    case CART_ACTIONS.ADD_ITEM: {
      const existingIndex = state.items.findIndex(
        (item) => item.productId === action.payload.productId
      );

      if (existingIndex >= 0) {
        // Update quantity if item exists
        const newItems = [...state.items];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + action.payload.quantity,
        };
        return { ...state, items: newItems };
      }

      // Add new item
      return {
        ...state,
        items: [...state.items, action.payload],
      };
    }

    case CART_ACTIONS.REMOVE_ITEM:
      return {
        ...state,
        items: state.items.filter((_, index) => index !== action.payload),
      };

    case CART_ACTIONS.UPDATE_QUANTITY: {
      const newItems = [...state.items];
      newItems[action.payload.index] = {
        ...newItems[action.payload.index],
        quantity: action.payload.quantity,
      };
      return { ...state, items: newItems };
    }

    case CART_ACTIONS.CLEAR_CART:
      return { ...state, items: [] };

    default:
      return state;
  }
}

// Create context
const CartContext = createContext(null);

/**
 * Cart Provider Component
 */
export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Add item to cart
  const addItem = useCallback((product, quantity = 1) => {
    dispatch({
      type: CART_ACTIONS.ADD_ITEM,
      payload: {
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity,
      },
    });
  }, []);

  // Remove item from cart
  const removeItem = useCallback((index) => {
    dispatch({
      type: CART_ACTIONS.REMOVE_ITEM,
      payload: index,
    });
  }, []);

  // Update item quantity
  const updateQuantity = useCallback((index, quantity) => {
    dispatch({
      type: CART_ACTIONS.UPDATE_QUANTITY,
      payload: { index, quantity: Math.max(1, quantity) },
    });
  }, []);

  // Clear cart
  const clearCart = useCallback(() => {
    dispatch({ type: CART_ACTIONS.CLEAR_CART });
  }, []);

  // Calculate total
  const total = state.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Get item count
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

  const value = {
    items: state.items,
    total,
    itemCount,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

/**
 * Custom hook to use cart context
 */
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default CartContext;
