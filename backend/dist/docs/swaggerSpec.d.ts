export declare const swaggerSpec: {
    openapi: string;
    info: {
        title: string;
        version: string;
        description: string;
        contact: {
            name: string;
        };
    };
    servers: {
        url: string;
        description: string;
    }[];
    components: {
        securitySchemes: {
            bearerAuth: {
                type: string;
                scheme: string;
                bearerFormat: string;
                description: string;
            };
        };
        schemas: {
            User: {
                type: string;
                properties: {
                    email: {
                        type: string;
                        example: string;
                    };
                    name: {
                        type: string;
                        example: string;
                    };
                    upiId: {
                        type: string;
                        example: string;
                    };
                };
            };
            Group: {
                type: string;
                properties: {
                    id: {
                        type: string;
                        example: string;
                    };
                    name: {
                        type: string;
                        example: string;
                    };
                    inviteCode: {
                        type: string;
                        example: string;
                    };
                    currency: {
                        type: string;
                        example: string;
                    };
                    googleSheetSync: {
                        type: string;
                        example: boolean;
                    };
                    createdAt: {
                        type: string;
                        format: string;
                    };
                };
            };
            Flat: {
                type: string;
                properties: {
                    id: {
                        type: string;
                        example: string;
                    };
                    name: {
                        type: string;
                        example: string;
                    };
                    inviteCode: {
                        type: string;
                        example: string;
                    };
                    currency: {
                        type: string;
                        example: string;
                    };
                    googleSheetSync: {
                        type: string;
                        example: boolean;
                    };
                    createdAt: {
                        type: string;
                        format: string;
                    };
                };
            };
            Expense: {
                type: string;
                properties: {
                    id: {
                        type: string;
                        example: string;
                    };
                    flatId: {
                        type: string;
                        example: string;
                    };
                    payerEmail: {
                        type: string;
                        example: string;
                    };
                    title: {
                        type: string;
                        example: string;
                    };
                    totalAmountDisplay: {
                        type: string;
                        example: number;
                    };
                    totalAmountMinorUnits: {
                        type: string;
                        example: number;
                    };
                    category: {
                        type: string;
                        enum: string[];
                        example: string;
                    };
                    splitType: {
                        type: string;
                        enum: string[];
                        example: string;
                    };
                    splits: {
                        type: string;
                        additionalProperties: {
                            type: string;
                        };
                        example: {
                            'rahul@flat.com': number;
                            'amit@flat.com': number;
                        };
                    };
                    utrNumber: {
                        type: string;
                        example: string;
                    };
                    overwrittenFlag: {
                        type: string;
                        enum: string[];
                        example: string;
                    };
                    sheetRowIndex: {
                        type: string;
                        example: number;
                    };
                    sheetRowLink: {
                        type: string;
                        example: string;
                    };
                };
            };
            DuplicateConflict: {
                type: string;
                properties: {
                    status: {
                        type: string;
                        example: string;
                    };
                    duplicateType: {
                        type: string;
                        enum: string[];
                    };
                    message: {
                        type: string;
                    };
                    existingRecord: {
                        type: string;
                        properties: {
                            id: {
                                type: string;
                                example: string;
                            };
                            title: {
                                type: string;
                                example: string;
                            };
                            amountDisplay: {
                                type: string;
                                example: number;
                            };
                            payerEmail: {
                                type: string;
                                example: string;
                            };
                            utrNumber: {
                                type: string;
                                example: string;
                            };
                            sheetUrl: {
                                type: string;
                            };
                        };
                    };
                    incomingRecord: {
                        type: string;
                        properties: {
                            title: {
                                type: string;
                                example: string;
                            };
                            amountDisplay: {
                                type: string;
                                example: number;
                            };
                        };
                    };
                };
            };
        };
    };
    paths: {
        '/health': {
            get: {
                summary: string;
                tags: string[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        status: {
                                            type: string;
                                            example: string;
                                        };
                                        storageMode: {
                                            type: string;
                                            example: string;
                                        };
                                        timestamp: {
                                            type: string;
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
        };
        '/auth/register': {
            post: {
                summary: string;
                tags: string[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    email: {
                                        type: string;
                                        example: string;
                                    };
                                    password: {
                                        type: string;
                                        example: string;
                                    };
                                    name: {
                                        type: string;
                                        example: string;
                                    };
                                    upiId: {
                                        type: string;
                                        example: string;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    201: {
                        description: string;
                    };
                };
            };
        };
        '/auth/login': {
            post: {
                summary: string;
                tags: string[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    email: {
                                        type: string;
                                        example: string;
                                    };
                                    password: {
                                        type: string;
                                        example: string;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                    };
                };
            };
        };
        '/auth/me': {
            get: {
                summary: string;
                tags: string[];
                security: {
                    bearerAuth: never[];
                }[];
                responses: {
                    200: {
                        description: string;
                    };
                };
            };
        };
        '/groups': {
            post: {
                summary: string;
                tags: string[];
                security: {
                    bearerAuth: never[];
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    name: {
                                        type: string;
                                        example: string;
                                    };
                                    currency: {
                                        type: string;
                                        example: string;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    201: {
                        description: string;
                    };
                };
            };
        };
        '/groups/{id}': {
            get: {
                summary: string;
                tags: string[];
                security: {
                    bearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                    };
                    404: {
                        description: string;
                    };
                };
            };
        };
        '/groups/{id}/members': {
            get: {
                summary: string;
                tags: string[];
                security: {
                    bearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                    };
                };
            };
        };
        '/groups/join': {
            post: {
                summary: string;
                tags: string[];
                security: {
                    bearerAuth: never[];
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    inviteCode: {
                                        type: string;
                                        example: string;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                    };
                };
            };
        };
        '/groups/{id}/members/away': {
            patch: {
                summary: string;
                tags: string[];
                security: {
                    bearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                properties: {
                                    isAway: {
                                        type: string;
                                        example: boolean;
                                    };
                                    awayUntil: {
                                        type: string;
                                        example: string;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                    };
                };
            };
        };
        '/groups/{id}/sync-settings': {
            patch: {
                summary: string;
                tags: string[];
                security: {
                    bearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    googleSheetSync: {
                                        type: string;
                                        example: boolean;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                    };
                };
            };
        };
        '/flats': {
            post: {
                summary: string;
                tags: string[];
                security: {
                    bearerAuth: never[];
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    name: {
                                        type: string;
                                        example: string;
                                    };
                                    currency: {
                                        type: string;
                                        example: string;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    201: {
                        description: string;
                    };
                };
            };
        };
        '/flats/join': {
            post: {
                summary: string;
                tags: string[];
                security: {
                    bearerAuth: never[];
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    inviteCode: {
                                        type: string;
                                        example: string;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                    };
                };
            };
        };
        '/flats/{id}/members/away': {
            patch: {
                summary: string;
                tags: string[];
                security: {
                    bearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                properties: {
                                    isAway: {
                                        type: string;
                                        example: boolean;
                                    };
                                    awayUntil: {
                                        type: string;
                                        example: string;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                    };
                };
            };
        };
        '/flats/{id}/sync-settings': {
            patch: {
                summary: string;
                tags: string[];
                security: {
                    bearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    googleSheetSync: {
                                        type: string;
                                        example: boolean;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                    };
                };
            };
        };
        '/expenses': {
            post: {
                summary: string;
                tags: string[];
                security: {
                    bearerAuth: never[];
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    flatId: {
                                        type: string;
                                    };
                                    title: {
                                        type: string;
                                        example: string;
                                    };
                                    amount: {
                                        type: string;
                                        example: number;
                                    };
                                    category: {
                                        type: string;
                                        example: string;
                                    };
                                    splitType: {
                                        type: string;
                                        example: string;
                                    };
                                    utrNumber: {
                                        type: string;
                                        example: string;
                                    };
                                    allowOverwrite: {
                                        type: string;
                                        example: boolean;
                                    };
                                    overwriteTargetId: {
                                        type: string;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    201: {
                        description: string;
                    };
                    200: {
                        description: string;
                    };
                    409: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                };
            };
            get: {
                summary: string;
                tags: string[];
                security: {
                    bearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                    };
                };
            };
        };
        '/receipts/extract': {
            post: {
                summary: string;
                tags: string[];
                security: {
                    bearerAuth: never[];
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: string;
                                properties: {
                                    receipt: {
                                        type: string;
                                        format: string;
                                        description: string;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                    };
                };
            };
        };
        '/settlements/balances': {
            get: {
                summary: string;
                tags: string[];
                security: {
                    bearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                    };
                };
            };
        };
        '/settlements': {
            post: {
                summary: string;
                tags: string[];
                security: {
                    bearerAuth: never[];
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    flatId: {
                                        type: string;
                                    };
                                    receiverEmail: {
                                        type: string;
                                    };
                                    amount: {
                                        type: string;
                                        example: number;
                                    };
                                    notes: {
                                        type: string;
                                        example: string;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    201: {
                        description: string;
                    };
                };
            };
        };
        '/statements': {
            get: {
                summary: string;
                tags: string[];
                security: {
                    bearerAuth: never[];
                }[];
                parameters: ({
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        enum?: undefined;
                        default?: undefined;
                        format?: undefined;
                    };
                } | {
                    name: string;
                    in: string;
                    schema: {
                        type: string;
                        enum: string[];
                        default: string;
                        format?: undefined;
                    };
                    required?: undefined;
                } | {
                    name: string;
                    in: string;
                    schema: {
                        type: string;
                        format: string;
                        enum?: undefined;
                        default?: undefined;
                    };
                    required?: undefined;
                })[];
                responses: {
                    200: {
                        description: string;
                    };
                };
            };
        };
        '/cron/month-end-statement': {
            post: {
                summary: string;
                tags: string[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    description: string;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                    };
                    401: {
                        description: string;
                    };
                };
            };
        };
    };
};
//# sourceMappingURL=swaggerSpec.d.ts.map