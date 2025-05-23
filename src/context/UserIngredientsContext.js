import React, { createContext, useContext, useState } from 'react';

const UserIngredientsContext = createContext();

export function UserIngredientsProvider({ children }) {
  const [userIngredientsRaw, setUserIngredientsRaw] = useState([]);
  return (
    <UserIngredientsContext.Provider value={{ userIngredientsRaw, setUserIngredientsRaw }}>
      {children}
    </UserIngredientsContext.Provider>
  );
}

export function useUserIngredients() {
  return useContext(UserIngredientsContext);
}