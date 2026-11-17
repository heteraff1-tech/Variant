import {ref, unref} from 'vue'
import {handleError} from '../lib/errorHandler'

//управление состояниями 
export function useApi(apiFn, options = {}) {
    const data = ref(options.initialData || null)
    const loading = ref(false)
    const error = ref(null)

    //APi запрос
    const execute = async(...args) => {
        loading.value = true;
        error.value = null

        try {
            const result = await apiFn(...unref(args))
            data.value = result;
            return result
        } catch(err) {
            error.value = err

            //обработка ошибок
            if(options.showErrorToast !== false){
                handleError(err, {
                    fallbackMessage: options.errorMessage,
                    onError: options.onError
                })
            }
            throw err
        } finally {
            loading.value = false
        }
    }

    //сброс состояния
    const reset = () => {
        data.value = options.initialData || null;
        error.value = null
        loading.value = false
    }

    return {
        data, loading, error, execute, reset,
    }
}