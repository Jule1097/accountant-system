import { GeminiParsedVoucher } from "src/models/GeminiParsedVoucher";
import { CatalogRepository } from "src/repositories/catalog.repository";
import { ClientRepository } from "src/repositories/client.repository";
import { CompanyRepository } from "src/repositories/company.repository";
import { SupplierRepository } from "src/repositories/supplier.repository";
import { ParserVoucherType } from "src/types/parser-batch";
import { GeminiParserResponse, RawGeminiParsedVoucher } from "src/types/gemini-parser";

export class ParserResponseService {
  private readonly companyRepository: CompanyRepository;
  private readonly catalogRepository: CatalogRepository;
  private readonly clientRepository: ClientRepository;
  private readonly supplierRepository: SupplierRepository;

  constructor() {
    this.companyRepository = new CompanyRepository();
    this.catalogRepository = new CatalogRepository();
    this.clientRepository = new ClientRepository();
    this.supplierRepository = new SupplierRepository();
  }

  async buildResponse(
    companyId: string,
    _voucherKind: ParserVoucherType,
    extractedData: RawGeminiParsedVoucher
  ): Promise<GeminiParserResponse> {
    const company = await this.companyRepository.findById(companyId);
    const parsedVoucher = new GeminiParsedVoucher(extractedData, company?.cuit);
    const vatRates = await this.catalogRepository.getVatRates();
    const retentionConcepts = await this.catalogRepository.getRetentionConcepts();
    const perceptionConcepts = await this.catalogRepository.getPerceptionConcepts();
    const taxJurisdictions = await this.catalogRepository.getTaxJurisdictions();
    let thirdPartyId: string | null = null;
    const lookupThirdPartyCuit = parsedVoucher.getLookupThirdPartyCuit();

    if (lookupThirdPartyCuit) {
      const client = await this.clientRepository.findByCuitAndCompany(companyId, lookupThirdPartyCuit);
      const supplier = client
        ? null
        : await this.supplierRepository.findByCuitAndCompany(companyId, lookupThirdPartyCuit);

      if (client) {
        thirdPartyId = client.id;
      }

      if (supplier) {
        thirdPartyId = supplier.id;
      }
    }

    return parsedVoucher.toResponse(
      {
        vatRates,
        retentionConcepts,
        perceptionConcepts,
        taxJurisdictions,
      },
      thirdPartyId
    );
  }
}
