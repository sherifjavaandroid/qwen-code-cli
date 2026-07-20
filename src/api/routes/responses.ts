import _ from 'lodash';

import Request from '@/lib/request/Request.ts';
import Response from '@/lib/response/Response.ts';
import chat from '@/api/controllers/chat.ts';
import process from "process";

const QWEN_AUTHORIZATION = process.env.QWEN_AUTHORIZATION;

export default {

    prefix: '/v1',

    post: {

        '/responses': async (request: Request) => {
            request
                .validate('headers.authorization', _.isString);

            // 如果环境变量有token则使用环境变量的
            if (QWEN_AUTHORIZATION) {
                request.headers.authorization = "Bearer " + QWEN_AUTHORIZATION;
            }
            const tokens = chat.tokenSplit(request.headers.authorization);
            const token = _.sample(tokens);

            let { model, stream } = request.body;
            model = (model || "qwen3.7-max").toLowerCase();

            if (stream) {
                const responseStream = await chat.createResponsesStream(model, request.body, token);
                return new Response(responseStream, {
                    type: "text/event-stream"
                });
            }
            else
                return await chat.createResponses(model, request.body, token);
        }

    }

}
