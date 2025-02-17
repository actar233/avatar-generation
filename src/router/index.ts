import {createRouter, createWebHashHistory} from 'vue-router'
import routes from "./routes.ts";

export const router = createRouter({
    history: createWebHashHistory(),
    routes,
})
