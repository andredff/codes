import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Constants } from '../app/constants';
import { BaseService } from './base.service';
import { Pesquisa } from '../entidades';
import { ApiGateway } from '../providers/api.gateway';

import { PessoaFisica, CadastroPessoaFisica } from '../entidades';

@Injectable()
export class PessoaFisicaService extends BaseService {

    private url: string = Constants.API_ENDPOINT + 'pf';

    constructor(private apiGateway: ApiGateway) {
        super();
    }

    setIsMediador(isMediador: boolean) {
        let uri = '/isMediador';

        return this.apiGateway.postTextPlain(this.url + uri, "" + isMediador)
            .map(this.extractDataText)
            .catch(this.handleError);
    }

    criaPF(pf: PessoaFisica): Observable<any> {
        let body = JSON.stringify(pf);
        return this.apiGateway.put(this.url, body, this.defaultOptions)
            .map(this.extractData)
            .catch(this.handleError);
    }

    atualizaMinhaPF(pf: PessoaFisica): Observable<any> {
        let body = JSON.stringify(pf);
        return this.apiGateway.put(this.url + '/meusDados', body, this.defaultOptions)
            .map(this.extractData)
            .catch(this.handleError);
    }

    atualizaPF(pf: PessoaFisica): Observable<any> {
        let body = JSON.stringify(pf);
        return this.apiGateway.put(this.url, body, this.defaultOptions)
            .map(this.extractData)
            .catch(this.handleError);
    }

    list(): Observable<any> {
        return this.apiGateway.get(this.url + '/all',  this.defaultOptions)
            .map(this.extractData)
            .catch(this.handleError);
    }

    get(id: string): Observable<PessoaFisica> {
        return this.apiGateway.get(this.url + '/' + id,  this.defaultOptions)
            .map(this.extractData)
            .catch(this.handleError);
    }

    setAtivo(id: string, ativo: boolean) {
        return this.apiGateway.put(this.url + '/' + id + '/ativo', '' + ativo, this.plainTextOptions)
            .map(this.extractData)
            .catch(this.handleError);
    }

    addPessoaFisica(cadastroPessoaFisica: any): Observable<any> {
        //console.log('addPessoaFisica ' + cadastroPessoaFisica);
        //let uri '/pessoaFisica'
        //console.log('-enviando pessoaFisica-');
        //console.log(this.url);
        cadastroPessoaFisica.pessoaFisica.tp = 'PF';
        return this.apiGateway.postNoAuth(this.url, cadastroPessoaFisica, this.defaultOptions, 50000000)
            .map(this.extractData)
            .catch(this.handleError);
    }

    countAll() : Observable<any> {
        let uri = '/countAll';
        return this.apiGateway.get(this.url + uri,  this.defaultOptions)
        .map(this.extractData)
        .catch(this.handleError);
    }

    getPfLazy(pesquisa: Pesquisa) {
        let body = JSON.stringify(pesquisa);
        return this.apiGateway.post(Constants.API_ENDPOINT + 'pf/listLazy', body, this.defaultOptions)
                    .map(this.extractData)
                    .catch(this.handleError);
    }

    getPfsCount(pesquisa?: Pesquisa) {
        let body = JSON.stringify(pesquisa);
        return this.apiGateway.post(Constants.API_ENDPOINT + 'pf/countPessoasFisicas', body, this.plainTextOptions)
                    .map(this.extractData)
                    .catch(this.handleError);
    }
}