// Copyright 2024 Tether Operations Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
'use strict'

/** @typedef {import('./src/facilitator-evm-signer-adapter.js').ReadContractArgs} ReadContractArgs */
/** @typedef {import('./src/facilitator-evm-signer-adapter.js').VerifyTypedDataArgs} VerifyTypedDataArgs */
/** @typedef {import('./src/facilitator-evm-signer-adapter.js').WriteContractArgs} WriteContractArgs */
/** @typedef {import('./src/facilitator-evm-signer-adapter.js').SendTransactionArgs} SendTransactionArgs */
/** @typedef {import('./src/facilitator-evm-signer-adapter.js').WaitForTransactionReceiptArgs} WaitForTransactionReceiptArgs */
/** @typedef {import('./src/facilitator-evm-signer-adapter.js').GetCodeArgs} GetCodeArgs */
/** @typedef {import('./src/facilitator-evm-signer-adapter.js').TransactionReceiptResult} TransactionReceiptResult */
/** @typedef {import('./src/facilitator-evm-signer-adapter.js').FacilitatorEvmSigner} FacilitatorEvmSigner */

export { default as FacilitatorEvmSignerAdapter } from './src/facilitator-evm-signer-adapter.js'
