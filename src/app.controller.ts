import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  testSignature() {
    return this.appService.testSignature();
  }

  @Get('/createCollection')
  async createCollection() {
    return await this.appService.createCollection();
  }

  @Get('/createTree')
  async createTree() {
    return await this.appService.createMerkleTree();
  }

  // http://localhost:3001/mintNft
  @Get('/mintNft')
  async mintNft() {
    return await this.appService.mintNft();
  }

  @Get('/fetchNft')
  async fetchNft() {
    return await this.appService.fetchNft();
  }

  @Get('/fetchNftsForAddress')
  async fetchNftsForAddress() {
    return await this.appService.fetchNftsForAddress();
  }

  @Get('/transferNft')
  async transferNft() {
    return await this.appService.transferNft();
  }
}
