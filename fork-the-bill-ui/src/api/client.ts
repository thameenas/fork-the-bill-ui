import axios, {AxiosResponse, AxiosError} from 'axios';
import {API_CONFIG, getApiUrl} from './config';
import {
    ExpenseResponse,
    ExpenseRequest,
    ClaimItemRequest,
    PersonRequest,
    ApiError,
    Expense,
    Item,
    Person,
    PersonNameToIdMap
} from '../types';

// Create axios instance with default configuration
const apiClient = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: API_CONFIG.DEFAULT_HEADERS,
});

apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error: AxiosError) => {
        const responseData = error.response?.data as any;
        const apiError: ApiError = {
            timestamp: new Date().toISOString(),
            status: error.response?.status || 500,
            error: error.response?.statusText || 'Unknown Error',
            message: responseData?.message || error.message || 'An error occurred',
            path: error.config?.url || 'Unknown path',
        };
        throw apiError;
    }
);

// Helper functions for data conversion
export const convertExpenseResponseToExpense = (response: ExpenseResponse): Expense => {
    // Create mapping from person IDs to names for claimedBy arrays
    const personIdToName: { [personId: string]: string } = {};
    response.people.forEach(person => {
        personIdToName[person.id] = person.name;
    });

    // Convert items with person names instead of IDs
    const items: Item[] = response.items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        claimedBy: item.claimedBy.map(personId => personIdToName[personId] || personId),
    }));

    // Convert people with IDs
    const people: Person[] = response.people.map(person => ({
        id: person.id,
        name: person.name,
        itemsClaimed: person.itemsClaimed,
        amountOwed: person.amountOwed,
        subtotal: person.subtotal,
        taxShare: person.taxShare,
        tipShare: person.tipShare,
        totalOwed: person.totalOwed,
        isFinished: person.finished,
    }));

    return {
        id: response.id,
        slug: response.slug,
        createdAt: response.createdAt,
        payerName: response.payerName,
        totalAmount: response.totalAmount,
        subtotal: response.subtotal,
        tax: response.tax,
        tip: response.tip,
        items,
        people,
    };
};

export const convertExpenseToExpenseRequest = (expense: Expense): ExpenseRequest => {
    // Create mapping from person names to IDs
    const personNameToId: PersonNameToIdMap = {};
    expense.people.forEach(person => {
        if (person.id) {
            personNameToId[person.name] = person.id;
        }
    });

    // Convert items with person IDs instead of names
    const items = expense.items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
    }));

    // Convert people
    const people: PersonRequest[] = expense.people.map(person => ({
        name: person.name,
        itemsClaimed: person.itemsClaimed,
        amountOwed: person.amountOwed,
        subtotal: person.subtotal,
        taxShare: person.taxShare,
        tipShare: person.tipShare,
        totalOwed: person.totalOwed,
        isFinished: person.isFinished,
    }));

    return {
        payerName: expense.payerName,
        totalAmount: expense.totalAmount,
        subtotal: expense.subtotal,
        tax: expense.tax,
        tip: expense.tip,
        items,
        people,
    };
};

// API Functions
export const getExpense = async (slugOrId: string): Promise<Expense> => {
    try {
        const response: AxiosResponse<ExpenseResponse> = await apiClient.get(
            getApiUrl(API_CONFIG.ENDPOINTS.EXPENSE_BY_SLUG(slugOrId))
        );
        return convertExpenseResponseToExpense(response.data);
    } catch (error) {
        console.error('Failed to get expense:', error);
        throw error;
    }
};

export const createExpense = async (expenseData: ExpenseRequest): Promise<Expense> => {
    try {
        const response: AxiosResponse<ExpenseResponse> = await apiClient.post(
            getApiUrl(API_CONFIG.ENDPOINTS.EXPENSE),
            expenseData
        );
        return convertExpenseResponseToExpense(response.data);
    } catch (error) {
        console.error('Failed to create expense:', error);
        throw error;
    }
};

export const createExpenseFromImage = async (file: File, payerName: string): Promise<Expense> => {
    const formData = new FormData();
    formData.append('bill', file);
    formData.append('payerName', payerName);

    const response: AxiosResponse<ExpenseResponse> = await apiClient.post(
        getApiUrl(API_CONFIG.ENDPOINTS.EXPENSE_UPLOAD),
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 30000,
        }
    );

    return convertExpenseResponseToExpense(response.data);
};

export const updateExpense = async (slug: string, expenseData: ExpenseRequest): Promise<Expense> => {
    try {
        const response: AxiosResponse<ExpenseResponse> = await apiClient.put(
            getApiUrl(API_CONFIG.ENDPOINTS.EXPENSE_BY_SLUG(slug)),
            expenseData
        );
        return convertExpenseResponseToExpense(response.data);
    } catch (error) {
        console.error('Failed to update expense:', error);
        throw error;
    }
};

export const claimItem = async (slug: string, itemId: string, personId: string): Promise<Expense> => {
    try {
        const claimRequest: ClaimItemRequest = {
            personId: personId,
        };

        const response: AxiosResponse<ExpenseResponse> = await apiClient.post(
            getApiUrl(API_CONFIG.ENDPOINTS.CLAIM_ITEM(slug, itemId)),
            claimRequest
        );
        return convertExpenseResponseToExpense(response.data);
    } catch (error) {
        console.error('Failed to claim item:', error);
        throw error;
    }
};


export const unclaimItem = async (slug: string, itemId: string, personId: string): Promise<Expense> => {
    try {
        const response: AxiosResponse<ExpenseResponse> = await apiClient.delete(
            getApiUrl(API_CONFIG.ENDPOINTS.UNCLAIM_ITEM(slug, itemId, personId))
        );
        return convertExpenseResponseToExpense(response.data);
    } catch (error) {
        console.error('Failed to unclaim item:', error);
        throw error;
    }
};


export const addPersonToExpense = async (slug: string, personName: string): Promise<Expense> => {
    try {
        const personRequest: PersonRequest = {
            name: personName,
            isFinished: false,
        };

        const response: AxiosResponse<ExpenseResponse> = await apiClient.post(
            getApiUrl(API_CONFIG.ENDPOINTS.ADD_PERSON(slug)),
            personRequest
        );
        return convertExpenseResponseToExpense(response.data);
    } catch (error) {
        console.error('Failed to add person to expense:', error);
        throw error;
    }
};

export const markPersonAsFinished = async (slug: string, personName: string): Promise<Expense> => {
    try {
        // First, get the current expense to find person ID
        const currentExpense = await getExpense(slug);
        const person = currentExpense.people.find(p => p.name === personName);

        if (!person || !person.id) {
            throw new Error(`Person "${personName}" not found or missing ID`);
        }

        await apiClient.put(
            getApiUrl(API_CONFIG.ENDPOINTS.MARK_PERSON_FINISHED(slug, person.id))
        );

        // Return updated expense
        return await getExpense(slug);
    } catch (error) {
        console.error('Failed to mark person as finished:', error);
        throw error;
    }
};

export const markPersonAsPending = async (slug: string, personName: string): Promise<Expense> => {
    try {
        // First, get the current expense to find person ID
        const currentExpense = await getExpense(slug);
        const person = currentExpense.people.find(p => p.name === personName);

        if (!person || !person.id) {
            throw new Error(`Person "${personName}" not found or missing ID`);
        }

        await apiClient.put(
            getApiUrl(API_CONFIG.ENDPOINTS.MARK_PERSON_PENDING(slug, person.id))
        );

        // Return updated expense
        return await getExpense(slug);
    } catch (error) {
        console.error('Failed to mark person as pending:', error);
        throw error;
    }
};

// Legacy functions for backward compatibility
export const updateExpenseItems = async (slug: string, items: Item[]): Promise<Expense> => {
    try {
        // Get current expense
        const currentExpense = await getExpense(slug);

        // Convert items to request format
        const itemRequests = items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
        }));

        // Create updated expense request
        const expenseRequest: ExpenseRequest = {
            payerName: currentExpense.payerName,
            totalAmount: currentExpense.totalAmount,
            subtotal: currentExpense.subtotal,
            tax: currentExpense.tax,
            tip: currentExpense.tip,
            items: itemRequests,
            people: currentExpense.people.map(person => ({
                name: person.name,
                itemsClaimed: person.itemsClaimed,
                amountOwed: person.amountOwed,
                subtotal: person.subtotal,
                taxShare: person.taxShare,
                tipShare: person.tipShare,
                totalOwed: person.totalOwed,
                isFinished: person.isFinished,
            })),
        };

        return await updateExpense(slug, expenseRequest);
    } catch (error) {
        console.error('Failed to update expense items:', error);
        throw error;
    }
};

export const updateExpenseTaxTip = async (slug: string, tax: number, tip: number): Promise<Expense> => {
    try {
        // Get current expense
        const currentExpense = await getExpense(slug);

        // Create updated expense request
        const expenseRequest: ExpenseRequest = {
            payerName: currentExpense.payerName,
            totalAmount: currentExpense.subtotal + tax + tip,
            subtotal: currentExpense.subtotal,
            tax,
            tip,
            items: currentExpense.items.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
            })),
            people: currentExpense.people.map(person => ({
                name: person.name,
                itemsClaimed: person.itemsClaimed,
                amountOwed: person.amountOwed,
                subtotal: person.subtotal,
                taxShare: person.taxShare,
                tipShare: person.tipShare,
                totalOwed: person.totalOwed,
                isFinished: person.isFinished,
            })),
        };

        return await updateExpense(slug, expenseRequest);
    } catch (error) {
        console.error('Failed to update expense tax/tip:', error);
        throw error;
    }
};

export const updatePersonCompletionStatus = async (slug: string, personName: string, isFinished: boolean): Promise<Expense> => {
    try {
        // First, get the current expense to find person ID
        let currentExpense = await getExpense(slug);
        let person = currentExpense.people.find(p => p.name === personName);

        // If person doesn't exist, add them to the expense first
        if (!person || !person.id) {
            console.log(`Adding new person "${personName}" to expense for completion status update`);
            currentExpense = await addPersonToExpense(slug, personName);
            person = currentExpense.people.find(p => p.name === personName);

            if (!person || !person.id) {
                throw new Error(`Failed to add person "${personName}" to expense`);
            }
        }

        if (isFinished) {
            return await markPersonAsFinished(slug, personName);
        } else {
            return await markPersonAsPending(slug, personName);
        }
    } catch (error) {
        console.error('Failed to update person completion status:', error);
        throw error;
    }
};
