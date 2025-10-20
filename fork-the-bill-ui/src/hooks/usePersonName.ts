import { useState, useEffect } from 'react';

const PERSON_NAME_KEY = 'fork-the-bill-person-name';

export const usePersonName = (): [string, (name: string) => void] => {
  const [personName, setPersonNameState] = useState<string>('');

  useEffect(() => {
    try {
      const savedName = localStorage.getItem(PERSON_NAME_KEY);
      if (savedName) {
        setPersonNameState(savedName);
      }
    } catch (error) {
    }
  }, []);

  const setPersonName = (name: string) => {
    setPersonNameState(name);
    
    try {
      if (name.trim()) {
        localStorage.setItem(PERSON_NAME_KEY, name.trim());
      } else {
        localStorage.removeItem(PERSON_NAME_KEY);
      }
    } catch (error) {
    }
  };

  return [personName, setPersonName];
};
