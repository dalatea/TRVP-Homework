const base_url = 'http://localhost:3000'
const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
}

type Range = { from: Date, to: Date }
type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE'

type CreateResponse = {
    message: 'Ok',
    id: number
}

type OkResponse = {
    message: 'Ok'
}

export async function create<D>(url: string, data: D): Promise<CreateResponse> {
    return request('POST', url, headers, data)
}

export async function read<T>(url: string): Promise<T> {
    return request('GET', url)
}

export async function update<D>(url: string, data: D): Promise<OkResponse> {
    return request('PATCH', url, headers, data)
}

export async function delete_(url: string): Promise<OkResponse> {
    return request('DELETE', url)
}

async function request<T, D>(method: Method, url: string, headers?: Record<string, string>, data?: D): Promise<T> {
    const instant = new Date().getTime()
    const response = await fetch(`${base_url}${url}`, {
        method,
        headers,
        body: data === undefined ? undefined : JSON.stringify(data)
    })
    const now = new Date().getTime()
    console.debug(`[${(now - instant)}ms] ${method} - ${response.status} ${response.statusText} - ${url}`)
    return new Promise((resolve, reject) => {
        response.json().then(result => {
            if (response.ok) resolve(result)
            else reject(result)
        }, reject)
    })
}

export function overlaps(a: Range, b: Range): boolean {
    return Math.max(a.from.getTime(), b.from.getTime()) < Math.min(a.to.getTime(), b.to.getTime())
}