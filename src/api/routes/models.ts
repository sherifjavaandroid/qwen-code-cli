import _ from 'lodash';

export default {

    prefix: '/v1',

    get: {
        '/models': async () => {
            return {
                "data": [
                    {
                        "id": "qwen-plus",
                        "object": "model",
                        "owned_by": "qwen-free-api"
                    },
                    {
                        "id": "qwen-turbo",
                        "object": "model",
                        "owned_by": "qwen-free-api"
                    },
                    {
                        "id": "qwen-max",
                        "object": "model",
                        "owned_by": "qwen-free-api"
                    },
                    {
                        "id": "qwen-think",
                        "object": "model",
                        "owned_by": "qwen-free-api"
                    },
                    {
                        "id": "qwen-search",
                        "object": "model",
                        "owned_by": "qwen-free-api"
                    },
                    {
                        "id": "qwen-think-search",
                        "object": "model",
                        "owned_by": "qwen-free-api"
                    },
                    {
                        "id": "qwen3.5-plus",
                        "object": "model",
                        "owned_by": "qwen-free-api"
                    },
                    {
                        "id": "qwen3.5-flash",
                        "object": "model",
                        "owned_by": "qwen-free-api"
                    },
                    {
                        "id": "qwen3.6-plus",
                        "object": "model",
                        "owned_by": "qwen-free-api"
                    },
                    {
                        "id": "qwen3.6-max-preview",
                        "object": "model",
                        "owned_by": "qwen-free-api"
                    },
                    {
                        "id": "qwen3.6-27b",
                        "object": "model",
                        "owned_by": "qwen-free-api"
                    },
                    {
                        "id": "qwen3.7-plus",
                        "object": "model",
                        "owned_by": "qwen-free-api"
                    },
                    {
                        "id": "qwen3.7-max",
                        "object": "model",
                        "owned_by": "qwen-free-api"
                    },
                    {
                        "id": "qwen3.8-max-preview",
                        "object": "model",
                        "owned_by": "qwen-free-api"
                    },
                    {
                        "id": "qwen3-max",
                        "object": "model",
                        "owned_by": "qwen-free-api"
                    },
                    {
                        "id": "qwen3-vl-plus",
                        "object": "model",
                        "owned_by": "qwen-free-api"
                    },
                    {
                        "id": "qwen3-vl-flash",
                        "object": "model",
                        "owned_by": "qwen-free-api"
                    }
                ]
            };
        }

    }
}