export const swaggerSpec = {
    openapi: '3.0.3',
    info: {
        title: 'Shared Expense Tracker API',
        version: '1.0.0',
        description: 'Backend API for Flatmate Expense Tracker with Angular 21, Turso libSQL Edge DB, Google Sheets live sync, GPay receipt OCR parsing, and Min-Cash-Flow debt simplification.',
        contact: {
            name: 'Flatmate Tracker Engineering',
        },
    },
    servers: [
        {
            url: '/api',
            description: 'Current Environment API Base',
        },
        {
            url: 'http://localhost:3000/api',
            description: 'Local Development Server',
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Provide JWT token obtained from /api/auth/register or /api/auth/login',
            },
        },
        schemas: {
            User: {
                type: 'object',
                properties: {
                    email: { type: 'string', example: 'rahul@flat.com' },
                    name: { type: 'string', example: 'Rahul Sharma' },
                    upiId: { type: 'string', example: 'rahul@okicici' },
                },
            },
            Group: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'group_1727889100' },
                    name: { type: 'string', example: 'Palm Springs 402' },
                    inviteCode: { type: 'string', example: 'PAL4X9' },
                    currency: { type: 'string', example: 'INR' },
                    googleSheetSync: { type: 'boolean', example: true },
                    createdAt: { type: 'string', format: 'date-time' },
                },
            },
            Flat: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'group_1727889100' },
                    name: { type: 'string', example: 'Palm Springs 402' },
                    inviteCode: { type: 'string', example: 'PAL4X9' },
                    currency: { type: 'string', example: 'INR' },
                    googleSheetSync: { type: 'boolean', example: true },
                    createdAt: { type: 'string', format: 'date-time' },
                },
            },
            Expense: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'exp_1727889200' },
                    flatId: { type: 'string', example: 'flat_1727889100' },
                    payerEmail: { type: 'string', example: 'rahul@flat.com' },
                    title: { type: 'string', example: 'Blinkit Groceries' },
                    totalAmountDisplay: { type: 'number', example: 840.0 },
                    totalAmountMinorUnits: { type: 'integer', example: 84000 },
                    category: {
                        type: 'string',
                        enum: [
                            'Groceries',
                            'Rent',
                            'Electricity',
                            'Wi-Fi',
                            'Maid & Cook',
                            'Drinking Water',
                            'Household',
                            'Food & Dining',
                            'Other',
                        ],
                        example: 'Groceries',
                    },
                    splitType: {
                        type: 'string',
                        enum: ['EQUAL', 'EXACT', 'PERCENTAGE', 'SHARES'],
                        example: 'EQUAL',
                    },
                    splits: {
                        type: 'object',
                        additionalProperties: { type: 'integer' },
                        example: { 'rahul@flat.com': 42000, 'amit@flat.com': 42000 },
                    },
                    utrNumber: { type: 'string', example: '427819283719' },
                    overwrittenFlag: { type: 'string', enum: ['YES', 'NO'], example: 'NO' },
                    sheetRowIndex: { type: 'integer', example: 5 },
                    sheetRowLink: {
                        type: 'string',
                        example: 'https://docs.google.com/spreadsheets/d/.../edit#gid=0&range=A5:L5',
                    },
                },
            },
            DuplicateConflict: {
                type: 'object',
                properties: {
                    status: { type: 'string', example: 'DUPLICATE_DETECTED' },
                    duplicateType: { type: 'string', enum: ['EXACT_UTR', 'FUZZY_FINGERPRINT'] },
                    message: { type: 'string' },
                    existingRecord: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', example: 'exp_1727889200' },
                            title: { type: 'string', example: 'Blinkit Groceries' },
                            amountDisplay: { type: 'number', example: 840.0 },
                            payerEmail: { type: 'string', example: 'rahul@flat.com' },
                            utrNumber: { type: 'string', example: '427819283719' },
                            sheetUrl: { type: 'string' },
                        },
                    },
                    incomingRecord: {
                        type: 'object',
                        properties: {
                            title: { type: 'string', example: 'Blinkit Groceries' },
                            amountDisplay: { type: 'number', example: 840.0 },
                        },
                    },
                },
            },
        },
    },
    paths: {
        '/health': {
            get: {
                summary: 'System Health & Storage Mode',
                tags: ['System'],
                responses: {
                    200: {
                        description: 'API is healthy',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', example: 'ok' },
                                        storageMode: { type: 'string', example: 'dual' },
                                        timestamp: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        '/auth/register': {
            post: {
                summary: 'Register User',
                tags: ['Authentication'],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email', 'password', 'name'],
                                properties: {
                                    email: { type: 'string', example: 'rahul@flat.com' },
                                    password: { type: 'string', example: 'secret123' },
                                    name: { type: 'string', example: 'Rahul Sharma' },
                                    upiId: { type: 'string', example: 'rahul@okicici' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: { description: 'User registered successfully with JWT' },
                },
            },
        },
        '/auth/login': {
            post: {
                summary: 'Login User',
                tags: ['Authentication'],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email'],
                                properties: {
                                    email: { type: 'string', example: 'rahul@flat.com' },
                                    password: { type: 'string', example: 'secret123' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'JWT authentication token' },
                },
            },
        },
        '/auth/me': {
            get: {
                summary: 'Get Current Authenticated User Profile',
                tags: ['Authentication'],
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'Authenticated user info' },
                },
            },
        },
        '/groups': {
            post: {
                summary: 'Create a Group & Generate Invite Code',
                tags: ['Groups'],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['name'],
                                properties: {
                                    name: { type: 'string', example: 'Palm Springs 402' },
                                    currency: { type: 'string', example: 'INR' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: { description: 'Group created with 6-char invite code' },
                },
            },
        },
        '/groups/{id}': {
            get: {
                summary: 'Get Group by ID (getGroupById)',
                tags: ['Groups'],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Group details and members' },
                    404: { description: 'Group not found' },
                },
            },
        },
        '/groups/{id}/members': {
            get: {
                summary: 'Get Group Members',
                tags: ['Groups'],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'List of group members' },
                },
            },
        },
        '/groups/join': {
            post: {
                summary: 'Join Group by Invite Code',
                tags: ['Groups'],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['inviteCode'],
                                properties: {
                                    inviteCode: { type: 'string', example: 'PAL4X9' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'Successfully joined group' },
                },
            },
        },
        '/groups/{id}/members/away': {
            patch: {
                summary: 'Toggle Vacation / Away Mode',
                tags: ['Groups'],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    isAway: { type: 'boolean', example: true },
                                    awayUntil: { type: 'string', example: '2026-10-15' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'Away status updated' },
                },
            },
        },
        '/groups/{id}/sync-settings': {
            patch: {
                summary: 'Toggle Group-Level Google Sheet Sync (bool)',
                tags: ['Groups'],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['googleSheetSync'],
                                properties: {
                                    googleSheetSync: { type: 'boolean', example: false },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'Google Sheet Sync toggled for group' },
                },
            },
        },
        '/flats': {
            post: {
                summary: 'Create a Flat & Generate Invite Code',
                tags: ['Flats'],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['name'],
                                properties: {
                                    name: { type: 'string', example: 'Palm Springs 402' },
                                    currency: { type: 'string', example: 'INR' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: { description: 'Flat created with 6-char invite code' },
                },
            },
        },
        '/flats/join': {
            post: {
                summary: 'Join Flat by Invite Code',
                tags: ['Flats'],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['inviteCode'],
                                properties: {
                                    inviteCode: { type: 'string', example: 'PAL4X9' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'Successfully joined flat' },
                },
            },
        },
        '/flats/{id}/members/away': {
            patch: {
                summary: 'Toggle Vacation / Away Mode',
                tags: ['Flats'],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    isAway: { type: 'boolean', example: true },
                                    awayUntil: { type: 'string', example: '2026-10-15' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'Away status updated' },
                },
            },
        },
        '/flats/{id}/sync-settings': {
            patch: {
                summary: 'Toggle Flat-Level Google Sheet Sync (bool)',
                tags: ['Flats'],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['googleSheetSync'],
                                properties: {
                                    googleSheetSync: { type: 'boolean', example: false },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'Google Sheet Sync toggled for flat' },
                },
            },
        },
        '/expenses': {
            post: {
                summary: 'Add Expense (With Deduplication & Overwrite Support)',
                tags: ['Expenses'],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['flatId', 'title', 'amount'],
                                properties: {
                                    flatId: { type: 'string' },
                                    title: { type: 'string', example: 'Blinkit Groceries' },
                                    amount: { type: 'number', example: 840.0 },
                                    category: { type: 'string', example: 'Groceries' },
                                    splitType: { type: 'string', example: 'EQUAL' },
                                    utrNumber: { type: 'string', example: '427819283719' },
                                    allowOverwrite: { type: 'boolean', example: false },
                                    overwriteTargetId: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: { description: 'Expense created' },
                    200: { description: 'Existing expense overwritten in-place' },
                    409: {
                        description: 'Duplicate detected with linked ID and Sheet permalink',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/DuplicateConflict' },
                            },
                        },
                    },
                },
            },
            get: {
                summary: 'List Expenses for Flat',
                tags: ['Expenses'],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'flatId', in: 'query', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'List of flat expenses' },
                },
            },
        },
        '/receipts/extract': {
            post: {
                summary: 'Upload Receipt Screenshot -> OCR Multimodal Extraction',
                tags: ['Receipt OCR'],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                properties: {
                                    receipt: {
                                        type: 'string',
                                        format: 'binary',
                                        description: 'Screenshot image from GPay/PhonePe/Paytm',
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Extracted amount, merchant, and 12-digit UPI UTR',
                    },
                },
            },
        },
        '/settlements/balances': {
            get: {
                summary: 'Calculate Net Balances & Min-Cash-Flow Simplified Debts',
                tags: ['Settlements'],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'flatId', in: 'query', required: true, schema: { type: 'string' } }],
                responses: {
                    200: {
                        description: 'Returns net balances and minimum transfers with direct upi://pay deep links',
                    },
                },
            },
        },
        '/settlements': {
            post: {
                summary: 'Record a Debt Settlement Payment',
                tags: ['Settlements'],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['flatId', 'receiverEmail', 'amount'],
                                properties: {
                                    flatId: { type: 'string' },
                                    receiverEmail: { type: 'string' },
                                    amount: { type: 'number', example: 420.0 },
                                    notes: { type: 'string', example: 'GPay transfer' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: { description: 'Settlement recorded' },
                },
            },
        },
        '/statements': {
            get: {
                summary: 'Generate On-Demand Statement & WhatsApp Digest',
                tags: ['Statements'],
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'flatId', in: 'query', required: true, schema: { type: 'string' } },
                    {
                        name: 'period',
                        in: 'query',
                        schema: { type: 'string', enum: ['current', 'last', 'custom'], default: 'current' },
                    },
                    { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
                    { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
                ],
                responses: {
                    200: {
                        description: 'Statement metrics, category breakdown, and pre-formatted WhatsApp link',
                    },
                },
            },
        },
        '/cron/month-end-statement': {
            post: {
                summary: 'Automated Month-End Cron Trigger (GitHub Actions)',
                tags: ['Automation'],
                parameters: [
                    {
                        name: 'Authorization',
                        in: 'header',
                        required: true,
                        description: 'Bearer <CRON_SECRET>',
                        schema: { type: 'string' },
                    },
                ],
                responses: {
                    200: { description: 'Month-end snapshots archived in Turso & Google Sheets' },
                    401: { description: 'Unauthorized' },
                },
            },
        },
    },
};
//# sourceMappingURL=swaggerSpec.js.map