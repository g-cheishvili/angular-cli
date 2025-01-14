/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { TimeoutError, concatMap, count, take, timeout } from 'rxjs';
import { executeDevServer } from '../../index';
import { describeServeBuilder } from '../jasmine-helpers';
import { BASE_OPTIONS, BUILD_TIMEOUT, DEV_SERVER_BUILDER_INFO } from '../setup';

describeServeBuilder(
  executeDevServer,
  DEV_SERVER_BUILDER_INFO,
  (harness, setupTarget, isViteRun) => {
    // TODO(fix-vite): currently this is broken in vite.
    (isViteRun ? xdescribe : describe)('Option: "watch"', () => {
      beforeEach(() => {
        setupTarget(harness);
      });

      it('does not wait for file changes when false', async () => {
        harness.useTarget('serve', {
          ...BASE_OPTIONS,
          watch: false,
        });

        await harness
          .execute()
          .pipe(
            timeout(BUILD_TIMEOUT),
            concatMap(async ({ result }, index) => {
              expect(result?.success).toBe(true);

              switch (index) {
                case 0:
                  await harness.modifyFile(
                    'src/main.ts',
                    (content) => content + 'console.log("abcd1234");',
                  );
                  break;
                case 1:
                  fail('Expected files to not be watched.');
                  break;
              }
            }),
            take(2),
          )
          .toPromise()
          .catch((error) => {
            // Timeout is expected if watching is disabled
            if (error instanceof TimeoutError) {
              return;
            }
            throw error;
          });
      });

      it('watches for file changes when not present', async () => {
        harness.useTarget('serve', {
          ...BASE_OPTIONS,
          watch: undefined,
        });

        const buildCount = await harness
          .execute()
          .pipe(
            timeout(BUILD_TIMEOUT),
            concatMap(async ({ result }, index) => {
              expect(result?.success).toBe(true);

              switch (index) {
                case 0:
                  await harness.modifyFile(
                    'src/main.ts',
                    (content) => content + 'console.log("abcd1234");',
                  );
                  break;
                case 1:
                  break;
              }
            }),
            take(2),
            count(),
          )
          .toPromise();

        expect(buildCount).toBe(2);
      });

      it('watches for file changes when true', async () => {
        harness.useTarget('serve', {
          ...BASE_OPTIONS,
          watch: true,
        });

        const buildCount = await harness
          .execute()
          .pipe(
            timeout(BUILD_TIMEOUT),
            concatMap(async ({ result }, index) => {
              expect(result?.success).toBe(true);

              switch (index) {
                case 0:
                  await harness.modifyFile(
                    'src/main.ts',
                    (content) => content + 'console.log("abcd1234");',
                  );
                  break;
                case 1:
                  break;
              }
            }),
            take(2),
            count(),
          )
          .toPromise();

        expect(buildCount).toBe(2);
      });
    });
  },
);
