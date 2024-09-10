import request from 'supertest';
import app from '../src/app';
import * as utils from '../src/csvUtils';
import { Address, Customer, AddressType } from '../src/types';

// Mock the readShippingDetailsCSV function
jest.mock('../src/csvUtils', () => ({
    writeResponseToCSV: jest.fn(),
    readShippingDetailsCSV: jest.fn() as jest.MockedFunction<typeof utils.readShippingDetailsCSV>,
}));

describe('POST /customer', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });    

    it('should return 400 for invalid data format', async () => {
        const response = await request(app)
            .post('/customer')
            .send({ invalid: 'data' });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ status: 400, message: 'Invalid data format' });
        expect(utils.writeResponseToCSV).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should handle missing customerId in the request', async () => {
        const customers: Partial<Customer>[] = [{ 
            shipping: { address: { line1: '123 Shipping St', city: 'Shipping City', state: 'SC', postalCode: '12345', country: 'Shipping Country' } }, 
            billing: { address: { line1: '456 Billing Ave', city: 'Billing City', state: 'BC', postalCode: '67890', country: 'Billing Country' } },
            contactNumber: '',
            email: '',
            products: []
        }];

        const response = await request(app)
            .post('/customer')
            .send({ data: customers });

        expect(response.status).toBe(200);
        expect(utils.writeResponseToCSV).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should handle server errors', async () => {
        (utils.writeResponseToCSV as jest.MockedFunction<typeof utils.writeResponseToCSV>)
            .mockRejectedValueOnce(new Error('Simulated server error'));

        const response = await request(app)
            .post('/customer')
            .send({ data: [{ customerId: '123', shipping: null, billing: null, contactNumber: '', email: '', products: [] }] });

        expect(response.status).toBe(500);
        expect(response.body).toEqual(expect.any(Object));
    });

    it('should handle valid input with both shipping and billing addresses', async () => {
        const mockShippingAddress: Address = {
            address: {
                line1: '123 Shipping St',
                line2: 'Apt 4B',
                city: 'Shipping City',
                state: 'SC',
                postalCode: '12345',
                country: 'Shipping Country'
            }
        };
    
        const mockBillingAddress: Address = {
            address: {
                line1: '456 Billing Ave',
                line2: '',
                city: 'Billing City',
                state: 'BC',
                postalCode: '67890',
                country: 'Billing Country'
            }
        };
    
        (utils.readShippingDetailsCSV as jest.MockedFunction<typeof utils.readShippingDetailsCSV>)
            .mockImplementation(async (customer: Customer, type) => {
                if (type === AddressType.Billing) {
                    return Promise.resolve({address: mockBillingAddress}); 
                } else if (type === AddressType.Shipping) {
                    return Promise.resolve({address: mockShippingAddress}); 
                }
                return Promise.resolve(null);
            });
    
        const customers: Customer[] = [{
            customerId: '123',
            shipping: null,
            billing: null,
            contactNumber: '',
            email: '',
            products: []
        }];
    
        const response = await request(app)
            .post('/customer')
            .send({ data: customers });
    
        expect(response.status).toBe(200);
        expect(response.body).toEqual([expect.objectContaining({
            customerId: '123',
            shipping: mockShippingAddress,
            billing: mockBillingAddress
        })]);
        expect(utils.writeResponseToCSV).toHaveBeenCalledWith(expect.any(Object));
    });
    
    it('should handle valid input with missing billing address', async () => {
        const mockShippingAddress: Address = {
            address: {
                line1: '123 Shipping St',
                line2: 'Apt 4B',
                city: 'Shipping City',
                state: 'SC',
                postalCode: '12345',
                country: 'Shipping Country'
            }
        };
    
        (utils.readShippingDetailsCSV as jest.MockedFunction<typeof utils.readShippingDetailsCSV>)
            .mockImplementation(async (customer: Customer, type) => {
                if (type === AddressType.Billing) {
                    return Promise.resolve(null); // No billing address
                } else if (type === AddressType.Shipping) {
                    return Promise.resolve({address:mockShippingAddress}); // Returning Shipping Address
                }
                return Promise.resolve(null);
            });
    
        const customers: Customer[] = [{
            customerId: '123',
            shipping: null,
            billing: null,
            contactNumber: '',
            email: '',
            products: []
        }];
    
        const response = await request(app)
            .post('/customer')
            .send({ data: customers });
    
        expect(response.status).toBe(200);
        expect(response.body).toEqual([expect.objectContaining({
            customerId: '123',
            shipping: mockShippingAddress,
            billing: null
        })]);
        expect(utils.writeResponseToCSV).toHaveBeenCalledWith(expect.any(Object));
    });
    
    it('should handle valid input with missing shipping address', async () => {
        const mockBillingAddress: Address = {
            address: {
                line1: '456 Billing Ave',
                line2: '',
                city: 'Billing City',
                state: 'BC',
                postalCode: '67890',
                country: 'Billing Country'
            }
        };
    
        (utils.readShippingDetailsCSV as jest.MockedFunction<typeof utils.readShippingDetailsCSV>)
            .mockImplementation(async (customer: Customer, type) => {
                if (type === AddressType.Billing) {
                    return Promise.resolve({address:mockBillingAddress}); // Returning billing Address
                } else if (type === AddressType.Shipping) {
                    return Promise.resolve(null); // No shipping address
                }
                return Promise.resolve(null);
            });
    
        const customers: Customer[] = [{
            customerId: '123',
            shipping: null,
            billing: null,
            contactNumber: '',
            email: '',
            products: []
        }];
    
        const response = await request(app)
            .post('/customer')
            .send({ data: customers });
    
        expect(response.status).toBe(200);
        expect(response.body).toEqual([expect.objectContaining({
            customerId: '123',
            shipping: null,
            billing: mockBillingAddress
        })]);
        expect(utils.writeResponseToCSV).toHaveBeenCalledWith(expect.any(Object));
    });
    
    
});
