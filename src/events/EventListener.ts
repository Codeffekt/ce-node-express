
export interface EventListener<T> {

    onMessage(queue: string, event: T);    

}