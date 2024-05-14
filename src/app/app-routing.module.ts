import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DownloadDataComponent } from './download-data/download-data.component';

const routes: Routes = [
  {
    path: 'products',
    loadComponent: () =>
      import('./product/product.component')
        .then(m => m.ProductComponent)
  },
  {
    path: 'customers',
    loadComponent: () =>
      import('./customer/customer.component')
        .then(m => m.CustomerComponent)
  },
  {
    path: 'outbound-documents',
    loadComponent: () =>
      import('./outbound-document/outbound-document.component')
        .then(m => m.OutboundDocumentComponent)
  },
  {
    path: 'outbound-loads',
    loadComponent: () =>
      import('./outbound-load/outbound-load.component')
        .then(m => m.OutboundLoadComponent)
  },
  {
    path: 'download-data',
    component: DownloadDataComponent,
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(
    routes,
    { enableTracing: false }
  )],
  exports: [RouterModule]
})
export class AppRoutingModule { }
