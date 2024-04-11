/* eslint-disable @typescript-eslint/no-explicit-any */
import { dataService, IBackendService, IHttpResponse, IInterceptorUtils, ResponseInterceptorFn } from 'web-backend-api';
import { IOutboundLoad } from '../../src/app/outbound-load/entities/outbound-load.interface';
import { collectionName as collectionDocuments } from '../outbound-documents/outbound-documents.mock';
import { collectionName, outboundLoads, transformPost, transformPut } from './outbound-loads.mock';

dataService(collectionName, (dbService: IBackendService) => {

  // replace for url: http://{host:port}/api/loads/outbound
  // collection url after replace is: http://{host:port}/api/{collectionName}
  dbService.addReplaceUrl(collectionName, 'loads/outbound');

  dbService.addTransformPostMap(collectionName, transformPost);

  dbService.addTransformPutMap(collectionName, transformPut);

  dbService.addJoinGetAllMap(collectionName, {
    fieldId: 'documentsId',
    collectionSource: collectionDocuments,
    transformerGet: true,
    joinFields: true,
  });

  // add interceptor to generate a document identifier
  dbService.addRequestInterceptor({
    method: 'POST',
    path: 'identifier',
    applyToPath: 'beforeId',
    collectionName,
    response: (utils: IInterceptorUtils) => {
      const identifier = Math.floor(Math.random() * (9000000000 - 1000000000)) + 1000000000;
      return utils.fn.response(utils.url, 200, { identifier });
    }
  });

  const responseUnloadedDocuments: ResponseInterceptorFn = (utils: IInterceptorUtils) => {
    const query = new Map<string, any[]>();
    query.set('isLoaded', [false]);
    return dbService.get$(collectionDocuments, undefined, query, utils.url);
  };

  dbService.addRequestInterceptor({
    method: 'GET',
    path: 'documents',
    applyToPath: 'beforeId',
    collectionName,
    response: responseUnloadedDocuments,
  });

  const responseDocuments: ResponseInterceptorFn = async (utils: IInterceptorUtils) => {
    const load = await dbService.getInstance$<IOutboundLoad>(collectionName, utils.id);
    const query = new Map<string, any[]>();
    query.set('id', load.documentsId);
    return dbService.get$(collectionDocuments, undefined, query, utils.url);
  };

  dbService.addRequestInterceptor({
    method: 'GET',
    path: 'documents',
    applyToPath: 'afterId',
    collectionName,
    response: responseDocuments,
  });

  const responseCreateOutboundLoad: ResponseInterceptorFn = async (utils: IInterceptorUtils) => {
    const response = await dbService.post$(collectionName, undefined, utils.body, utils.url) as IHttpResponse<IOutboundLoad>;

    const outboundLoad = response.body;
    for (const documentId of outboundLoad.documentsId) {
      await dbService.put$(collectionDocuments, documentId.toString(), { isLoaded: true }, utils.url);
    }

    return response;
  };

  dbService.addRequestInterceptor({
    method: 'POST',
    path: '',
    applyToPath: 'beforeId',
    collectionName,
    response: responseCreateOutboundLoad,
  });

  const responseAddDocument: ResponseInterceptorFn = async (utils: IInterceptorUtils & { body: { documentId: number } }) => {
    const outboundLoad = await dbService.getInstance$<IOutboundLoad>(collectionName, utils.id);
    outboundLoad.documentsId.push(utils.body.documentId);

    const response = await dbService.post$(collectionName, utils.id, outboundLoad, utils.url);
    await dbService.put$(collectionDocuments, utils.body.documentId.toString(), { isLoaded: true }, utils.url);

    return response;
  };

  dbService.addRequestInterceptor({
    method: 'POST',
    path: 'documents/add',
    applyToPath: 'afterId',
    collectionName,
    response: responseAddDocument,
  });

  const responseRemoveDocument: ResponseInterceptorFn = async (utils: IInterceptorUtils & { body: { documentId: number } }) => {
    const outboundLoad = await dbService.getInstance$<IOutboundLoad>(collectionName, utils.id);
    // tslint:disable-next-line: triple-equals
    const index = outboundLoad.documentsId.findIndex(item => item == utils.body.documentId);
    if (index >= 0) {
      outboundLoad.documentsId.splice(index, 1);
    }
    const response = await dbService.post$(collectionName, utils.id, outboundLoad, utils.url);
    await dbService.put$(collectionDocuments, utils.body.documentId.toString(), { isLoaded: false }, utils.url);

    return response;
  };

  dbService.addRequestInterceptor({
    method: 'POST',
    path: 'documents/remove',
    applyToPath: 'afterId',
    collectionName,
    response: responseRemoveDocument,
  });

  const responseDeleteOutboundLoad: ResponseInterceptorFn = async (utils: IInterceptorUtils) => {
    const outboundLoad = await dbService.getInstance$<IOutboundLoad>(collectionName, utils.id);

    const response = await dbService.delete$(collectionName, utils.id, utils.url);
    for (const documentId of outboundLoad.documentsId) {
      await dbService.put$(collectionDocuments, documentId.toString(), { isLoaded: false }, utils.url);
    }

    return response;
  };


  dbService.addRequestInterceptor({
    method: 'DELETE',
    path: '',
    applyToPath: 'afterId',
    collectionName,
    response: responseDeleteOutboundLoad,
  });

  outboundLoads.forEach((outboundLoad) => {
    void dbService.storeData(collectionName, outboundLoad).then(() => null);
  });
});
