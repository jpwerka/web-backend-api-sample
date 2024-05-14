
import { HttpBackend } from '@angular/common/http';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { IBackendService, getBackendService } from 'web-backend-api';
import { BACKEND_SERVICE, HttpMockBackendService } from './http-mock-backend.service';

function httpMockBackendFactory(
  dbService: IBackendService,
): HttpBackend {
  return new HttpMockBackendService(dbService);
}

@NgModule({})
export class MockBackendApiModule {

  static forRoot(): ModuleWithProviders<MockBackendApiModule> {
    return {
      ngModule: MockBackendApiModule,
      providers: [
        { provide: BACKEND_SERVICE, useFactory: getBackendService },
        { provide: HttpBackend,
          useFactory: httpMockBackendFactory,
          deps: [BACKEND_SERVICE]
        },
      ]
    };
  }

  static forFeature(): ModuleWithProviders<MockBackendApiModule> {
    return MockBackendApiModule.forRoot();
  }
}
