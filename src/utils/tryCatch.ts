export default function tryCatch(func: any, fail: any) {
	try { return func() }
	catch (e) { return fail }
}
