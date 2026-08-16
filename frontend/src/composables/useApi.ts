import { ref } from 'vue'

const configured = String(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
export const API_BASE_URL = configured.endsWith('/api/v1') ? configured : `${configured}/api/v1`

function headers(body?: unknown) { const token=localStorage.getItem('accessToken'); return { Accept:'application/json', ...(body instanceof FormData?{}:{'Content-Type':'application/json'}), ...(token?{Authorization:`Bearer ${token}`}:{}) } }
async function parse<T>(response:Response):Promise<T>{if(response.status===204)return undefined as T;const data=await response.json().catch(()=>({}));if(!response.ok){const error=new Error(data.message||`HTTP ${response.status}`) as Error&{status?:number;errors?:Record<string,string>};error.status=response.status;error.errors=data.errors;throw error}return data}
let refresh:Promise<boolean>|null=null
async function refreshAccess(){try{const response=await fetch(`${API_BASE_URL}/auth/refresh-token`,{method:'POST',credentials:'include',headers:{Accept:'application/json'}});const data=await parse<{data:{accessToken:string}}>(response);localStorage.setItem('accessToken',data.data.accessToken);return true}catch{localStorage.removeItem('accessToken');localStorage.removeItem('user');return false}}
async function request<T>(endpoint:string,options:RequestInit={}){let response=await fetch(`${API_BASE_URL}${endpoint}`,{...options,credentials:'include',headers:{...headers(options.body),...options.headers}});if(response.status===401&&!endpoint.startsWith('/auth/')){refresh??=refreshAccess().finally(()=>{refresh=null});if(await refresh)response=await fetch(`${API_BASE_URL}${endpoint}`,{...options,credentials:'include',headers:{...headers(options.body),...options.headers}})}return parse<T>(response)}

export function useApi(){const loading=ref(false),error=ref<string|null>(null);async function run<T>(job:()=>Promise<T>){loading.value=true;error.value=null;try{return await job()}catch(e){error.value=e instanceof Error?e.message:'Đã có lỗi xảy ra';throw e}finally{loading.value=false}}
  const get=<T>(endpoint:string,params?:Record<string,string|number|boolean|undefined>)=>run(()=>{const q=new URLSearchParams();Object.entries(params||{}).forEach(([k,v])=>{if(v!==undefined&&v!=='')q.set(k,String(v))});return request<T>(endpoint+(q.size?`?${q}`:''))})
  const send = <T>(method: string, endpoint: string, body?: unknown, customHeaders?: Record<string, string>) => run(() => request<T>(endpoint, { method, body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body), headers: customHeaders }))
  return { loading, error, get, post: <T>(e: string, b?: unknown, headers?: Record<string, string>) => send<T>('POST', e, b, headers), put: <T>(e: string, b?: unknown, headers?: Record<string, string>) => send<T>('PUT', e, b, headers), patch: <T>(e: string, b?: unknown, headers?: Record<string, string>) => send<T>('PATCH', e, b, headers), del: <T>(e: string) => send<T>('DELETE', e) }
}
