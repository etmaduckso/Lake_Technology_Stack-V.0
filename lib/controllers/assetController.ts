"use server";

import BigNumber from "bignumber.js";
import { prisma } from "@/lib/db";

export const assetController = {
  getCalculatedUnitValue: async (assetId: string): Promise<string> => {
    try {
      const asset = await prisma.asset.findUnique({
        where: { id: assetId },
      });

      if (!asset || asset.totalTokens === 0) {
        return "0.00";
      }

      // Calculation: BigNumber(totalValue).dividedBy(totalSupply).toFixed(2)
      return new BigNumber(asset.valuation.toString())
        .dividedBy(asset.totalTokens)
        .toFixed(2);
    } catch (error) {
      console.error("[assetController.getCalculatedUnitValue] Error:", error);
      return "0.00";
    }
  },
};
