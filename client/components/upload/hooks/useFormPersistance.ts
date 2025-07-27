import { useState, useEffect, useRef, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { UploadFormData } from "../upload.types";

interface UseFormPersistenceOptions {
  key: string;
  initialData: Partial<UploadFormData>;
  excludeFields?: (keyof UploadFormData)[];
}

export function useFormPersistence({
  key,
  initialData,
  excludeFields = ["files"], // By default exclude files from persistence
}: UseFormPersistenceOptions) {
  const [persistedData, setPersistedData] = useState<Partial<UploadFormData>>(initialData);
  const initialDataRef = useRef(initialData);
  const isInitialized = useRef(false);

  // Update ref when initialData changes
  useEffect(() => {
    initialDataRef.current = initialData;
  }, [initialData]);

  // Initialize and load data from localStorage
  const initializeForm = useCallback((form: UseFormReturn<UploadFormData>, onFilesLost?: () => void) => {
    if (isInitialized.current) return;
    
    try {
      const savedData = localStorage.getItem(key);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        // Merge with initial data to ensure all fields exist
        const mergedData = { ...initialDataRef.current, ...parsedData };
        setPersistedData(mergedData);
        
        // Check if there were files before (stored as metadata)
        const hadFiles = parsedData._hadFiles;
        
        // Update form values with persisted data
        Object.entries(parsedData).forEach(([fieldKey, value]) => {
          if (!excludeFields.includes(fieldKey as keyof UploadFormData) && fieldKey !== '_hadFiles') {
            form.setValue(fieldKey as keyof UploadFormData, value as string | boolean | File[] | undefined);
          }
        });
        
        // Notify if files were lost
        if (hadFiles && onFilesLost) {
          onFilesLost();
        }
      }
    } catch (error) {
      console.error("Error loading persisted form data:", error);
      setPersistedData(initialDataRef.current);
    }
    
    isInitialized.current = true;
  }, [key, excludeFields]);

  // Save data to localStorage whenever it changes
  const updatePersistedData = (newData: Partial<UploadFormData>) => {
    try {
      // Create a copy of the data excluding specified fields
      const dataToSave = { ...newData };
      excludeFields.forEach((field) => {
        delete dataToSave[field];
      });
      
      // Save to localStorage
      localStorage.setItem(key, JSON.stringify(dataToSave));
      setPersistedData(newData);
    } catch (error) {
      console.error("Error saving form data:", error);
    }
  };

  // Clear persisted data
  const clearPersistedData = useCallback((form?: UseFormReturn<UploadFormData>) => {
    try {
      localStorage.removeItem(key);
      setPersistedData(initialDataRef.current);
      
      // Also reset the form if provided
      if (form) {
        form.reset(initialDataRef.current);
      }
    } catch (error) {
      console.error("Error clearing persisted data:", error);
    }
  }, [key]);

  return {
    persistedData,
    updatePersistedData,
    clearPersistedData,
    initializeForm, // New function to initialize form with persisted data
  };
}