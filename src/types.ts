export interface Address {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}

export interface ShippingAddress {
    address: Address;
}

export interface Customer {
    customerId: string;
    contactNumber: string;
    email: string;
    billingAddress: ShippingAddress;
    shipping: ShippingAddress | null;
    products: Array<{
        productId: string;
        productName: string;
        productDescription: string;
    }>;
}

//interface mentioning each row model in csv file
export interface customerRow {
    customerId: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}

export interface ResponseFormat {
    customerId: string | undefined;
    status: number;
    message: string;
}
