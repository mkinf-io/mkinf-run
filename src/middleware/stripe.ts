import { NextFunction, Request, Response } from "express";
import Stripe from "stripe";

const stripeSetup = async (req: Request, res: Response, next: NextFunction) => {
	if (!process.env.STRIPE_SECRET_KEY) { return res.status(500).json({ status: 500, message: "Server error" }); }
	const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
	req.stripe = stripe;
	next();
}

const checkClientStripeProfile = async (req: Request, res: Response, next: NextFunction) => {
	try {
		if (!req.stripe || !req.customerId) { return res.status(401).json({ status: 401, message: "Unauthorized" }); }

		// Check if the customer has a billing profile
		// const taxIds = await req.stripe.customers.listTaxIds(req.customerId);
		// const taxId = firstOrNull(taxIds.data);
		// const hasBillingProfile = taxId?.verification?.status === 'verified';
		const hasBillingProfile = true;

		if (!hasBillingProfile || !(await hasValidPaymentMethod(req.stripe, req.customerId))) {
			const session = await req.stripe.billingPortal.sessions.create({
				customer: req.customerId,
				return_url: 'https://mkinf.io'
			});
			return res.status(402).json({
				message: "Please provide valid payment details to proceed",
				url: session.url
			});
		}
		return next();
	} catch (error) {
		console.error(error);
		res.status(500).json({ status: 500, message: 'Server error' });
	}
}

const hasValidPaymentMethod = async (stripe: Stripe, customerId: string): Promise<boolean> => {
	// Retrieve the customer's payment methods
	const paymentMethods = await stripe.paymentMethods.list({
		customer: customerId,
		type: 'card',
	});
	// Check if the customer has a valid card
	return paymentMethods.data.some(
		(method) => {
			if (method.card) {
				const expMonth = method.card.exp_month;
				const expYear = method.card.exp_year;
				const expDate = new Date(expYear, expMonth - 1);
				const isNotExpired = expDate > new Date();
				const hasPassedChecks =
					method.card.checks?.cvc_check !== 'fail' &&
					method.card.checks?.address_line1_check !== 'fail' &&
					method.card.checks?.address_postal_code_check !== 'fail';
				return isNotExpired && hasPassedChecks;
			}
			return false;
		}
	);
}

export { checkClientStripeProfile, hasValidPaymentMethod, stripeSetup };
