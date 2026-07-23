export interface Country {
    code: string;
    name: string;
    currency: string;
    symbol: string;
}
/** Tous les pays (noms FR) avec leur devise principale. */
export declare const COUNTRIES: Country[];
export declare function findCountry(code: string): Country | undefined;
//# sourceMappingURL=countries.d.ts.map