import _ from 'lodash';

import Request from '@/lib/request/Request.ts';
import Response from '@/lib/response/Response.ts';
import chat from '@/api/controllers/chat.ts';
import process from "process";

const QWEN_AUTHORIZATION = process.env.QWEN_AUTHORIZATION;

export default {

    prefix: '/v1/chat',

    post: {

        '/completions': async (request: Request) => {
            request
                .validate('body.conversation_id', v => _.isUndefined(v) || _.isString(v))
                .validate('body.messages', _.isArray)
                .validate('headers.authorization', _.isString)

            // 如果环境变量有token则使用环境变量的
            if (QWEN_AUTHORIZATION) {
                request.headers.authorization = "Bearer " + QWEN_AUTHORIZATION;
            }
            // token切分
            const tokens = chat.tokenSplit(request.headers.authorization);
            // 随机挑选一个token
            const token = _.sample(tokens);
            let { model, conversation_id: convId, messages, stream, tools, tool_choice } = request.body;
            model = model.toLowerCase();
            if (stream) {
                const stream = await chat.createCompletionStream(model, messages, token, convId, 0, tools, tool_choice);
                return new Response(stream, {
                    type: "text/event-stream"
                });
            }
            else
                return await chat.createCompletion(model, messages, token, convId, 0, tools, tool_choice);
        }

    }

}