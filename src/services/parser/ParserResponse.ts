import { GeminiParsedVoucher } from "src/models/GeminiParsedVoucher";
import { CatalogRepository } from "src/repositories/catalog/catalog.repository";
import { CompanyRepository } from "src/repositories/company/company.repository";
import { ThirdPartyLookupService } from "src/services/third-party/ThirdPartyLookup";
import { ThirdPartyLookup } from "src/types/third-party/third-party-lookup";
import { ParserVoucherType } from "src/types/parser/parser-batch";
import { ParsedVoucherData, RawGeminiParsedVoucher } from "src/types/parser/gemini-parser";

export class ParserResponseService {
  private readonly companyRepository: CompanyRepository;
  private readonly catalogRepository: CatalogRepository;
  private readonly thirdPartyLookup: ThirdPartyLookup;

  constructor(thirdPartyLookup: ThirdPartyLookup = new ThirdPartyLookupService()) {
    this.companyRepository = new CompanyRepository();
    this.catalogRepository = new CatalogRepository();
    this.thirdPartyLookup = thirdPartyLookup;
  }

  async buildResponse(
    companyId: string,
    _voucherKind: ParserVoucherType,
    extractedData: RawGeminiParsedVoucher
  ): Promise<ParsedVoucherData> {
    const company = await this.companyRepository.findById(companyId);
    const parsedVoucher = new GeminiParsedVoucher(extractedData, company?.cuit);
    const vatRates = await this.catalogRepository.getVatRates();
    const retentionConcepts = await this.catalogRepository.getRetentionConcepts();
    const perceptionConcepts = await this.catalogRepository.getPerceptionConcepts();
    const taxJurisdictions = await this.catalogRepository.getTaxJurisdictions();
    let thirdPartyId: string | null = null;
    const lookupThirdPartyCuit = parsedVoucher.getLookupThirdPartyCuit();

    if (lookupThirdPartyCuit) {
      thirdPartyId = await this.thirdPartyLookup.findIdByCuit(companyId, lookupThirdPartyCuit);
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
