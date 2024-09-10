import express, { Request, Response } from 'express';
import { readShippingDetailsCSV, writeResponseToCSV } from './csvUtils';
import { ResponseFormat, Customer, AddressType } from './types';

const app = express();

// Middleware
app.use(express.json());

// sample success response construction
const successResponseJson = (customerId: string): ResponseFormat => ({
    customerId,
    status: 200,
    message: 'Success'
});

// sample failure response construction for bad input request
const failureResponseJson = (customerId: string): ResponseFormat => ({
    customerId,
    status: 400,
    message: 'Mandatory fields are missing'
});

// sample failure response construction for server error
const serverErrorResponseJson =  (customerId: string): ResponseFormat => ({
  customerId,
  status: 500,
  message: 'Internal server error'
});



//sample API to check and fetch shipping details of customers
app.post('/customer', async (req: Request, res: Response) => {
    try {
        const customers: Customer[] = req.body.data;
        let isAddressAvailable: boolean= true;
        //checks whether the customer data is present in req body
        if (!customers || !Array.isArray(customers)) {
            await writeResponseToCSV(failureResponseJson('N/A'));
            return res.status(400).send({status: 400, message: 'Invalid data format' });
        }

        //loops through all the customers to check and fetch for shipping address if not available
        const results = await Promise.all(customers.map(async (customer: Customer) => {
            const customerID = customer.customerId;
            if (!customerID) {
                isAddressAvailable = false;
                await writeResponseToCSV(failureResponseJson(customerID));
                return customer;
            }
            if( customer.shipping && customer.billing){
                return customer;
            }

            if (!customer.billing) {
                const billingDetails = await readShippingDetailsCSV(customer, AddressType.Billing);
                if (billingDetails) {
                    customer.billing = billingDetails.address;
                } else {
                    isAddressAvailable = false;
                    await writeResponseToCSV(failureResponseJson(customerID));
                    customer.billing = null;
                }
            }
            
            if (!customer.shipping) {
                const shippingDetails = await readShippingDetailsCSV(customer, AddressType.Shipping);
                if (shippingDetails) {
                    customer.shipping = shippingDetails.address;
                } else {
                    isAddressAvailable= false;
                    await writeResponseToCSV(failureResponseJson(customerID));
                    customer.shipping = null;
                }
            } 
            return customer;

            
        }));

        if(isAddressAvailable){
            await writeResponseToCSV(successResponseJson('N/A'));
        }
        res.status(200).send(results);
    } catch (error) {
        const result = await writeResponseToCSV(serverErrorResponseJson('N/A'));
        res.status(500).send(error);
    }
});

export default app;


