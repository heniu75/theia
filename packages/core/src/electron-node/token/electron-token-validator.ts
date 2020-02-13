/********************************************************************************
 * Copyright (C) 2020 Ericsson and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import * as http from 'http';
import * as cookie from 'cookie';
import { injectable, inject, named } from 'inversify';
import { ElectronSecurityToken } from '../../electron-common/electron-token';
import { BackendApplicationContribution } from '../../node';

/**
 * On Electron, we want to make sure that only electron windows access the backend services.
 */
@injectable()
export class ElectronTokenValidator implements BackendApplicationContribution {

    @inject(Promise) @named(ElectronSecurityToken)
    protected readonly electronSecurityTokenPromise: Promise<ElectronSecurityToken>;

    /**
     * `electronSecurityToken` can be undefined while the value is being resolved.
     */
    protected electronSecurityToken: ElectronSecurityToken | undefined;

    async onStart(): Promise<void> {
        console.log('meh', JSON.stringify(this.electronSecurityToken = await this.electronSecurityTokenPromise));
    }

    allowRequest(request: http.IncomingMessage): boolean {
        const token = this.extractTokenFromRequest(request);
        return typeof token !== 'undefined' && this.isTokenValid(token);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    isTokenValid(token: any): boolean {
        return typeof token === 'object' && token.value === this.electronSecurityToken!.value;
    }

    /**
     * Expects the token to be passed via cookies by default.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected extractTokenFromRequest(request: http.IncomingMessage): any {
        const cookieHeader = request.headers.cookie;
        if (typeof cookieHeader === 'string') {
            const token = cookie.parse(cookieHeader)[ElectronSecurityToken];
            console.log('ch', cookieHeader, token);
            if (typeof token === 'string') {
                return JSON.parse(token);
            }
        }
        return undefined;
    }

}
