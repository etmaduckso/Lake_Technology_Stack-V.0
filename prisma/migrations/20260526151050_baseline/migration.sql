-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'TOKENIZED');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('NOT_STARTED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "OperationType" AS ENUM ('DEPOSIT', 'USAGE', 'REFUND', 'ADJUSTMENT', 'MINT_FEE', 'INVESTMENT_FEE', 'SECONDARY_MARKET_FEE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "nickname" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "credits" INTEGER NOT NULL DEFAULT 5,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_medals" (
    "id" TEXT NOT NULL,
    "userWallet" TEXT NOT NULL,
    "medalId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_medals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "walletAddress" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "addedBy" TEXT,
    "role" TEXT NOT NULL DEFAULT 'SUPER_ADMIN',

    CONSTRAINT "admins_pkey" PRIMARY KEY ("walletAddress")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "ownerWallet" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "valuation" DECIMAL(20,2) NOT NULL,
    "tokenPrice" DECIMAL(20,2) NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "contractUrl" TEXT,
    "status" "AssetStatus" NOT NULL DEFAULT 'DRAFT',
    "contractAddress" TEXT,
    "isListed" BOOLEAN NOT NULL DEFAULT true,
    "chainId" INTEGER,
    "sector" TEXT,
    "tokenNature" TEXT,
    "treasuryTokens" INTEGER NOT NULL DEFAULT 0,
    "marketTokens" INTEGER NOT NULL DEFAULT 0,
    "tokensAvailable" INTEGER NOT NULL DEFAULT 0,
    "royalties" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc_records" (
    "id" TEXT NOT NULL,
    "userWallet" TEXT NOT NULL,
    "status" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "encryptedData" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,

    CONSTRAINT "kyc_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorWallet" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "targetId" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_ledger" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "operation_type" "OperationType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance_before" INTEGER NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "crypto_amount" DECIMAL(30,18),
    "crypto_symbol" VARCHAR(20),
    "tx_hash" VARCHAR(255),
    "related_order_id" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_orders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "external_tid" BIGINT NOT NULL,
    "amount_brl" DECIMAL(20,2) NOT NULL,
    "amount_crypto" DECIMAL(30,18) NOT NULL,
    "currency_symbol" VARCHAR(20) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "smart_contract_address" VARCHAR(255),
    "blockchain_network" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_credits" (
    "user_id" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_credits_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "webhook_logs" (
    "id" TEXT NOT NULL,
    "event_type" VARCHAR(50),
    "payload" JSONB NOT NULL,
    "token_received" VARCHAR(255),
    "external_tid" BIGINT,
    "related_order_id" TEXT,
    "ip_address" INET,
    "user_agent" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investment_receipts" (
    "id" TEXT NOT NULL,
    "investorWallet" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "amountPaidCrypto" DECIMAL(30,18) NOT NULL,
    "cryptoSymbol" TEXT NOT NULL DEFAULT 'SOL',
    "txHash" TEXT NOT NULL,
    "child_fraction_hash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'HELD',
    "resalePrice" DECIMAL(20,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investment_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_acknowledgements" (
    "id" TEXT NOT NULL,
    "userWallet" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "signatureHash" TEXT NOT NULL,

    CONSTRAINT "risk_acknowledgements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_permissions" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "grantedByMaster" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "isCitizen" BOOLEAN NOT NULL DEFAULT false,
    "citizenshipMintDate" TIMESTAMP(3),
    "sbtImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_walletAddress_key" ON "users"("walletAddress");

-- CreateIndex
CREATE INDEX "users_isDeleted_idx" ON "users"("isDeleted");

-- CreateIndex
CREATE INDEX "user_medals_userWallet_idx" ON "user_medals"("userWallet");

-- CreateIndex
CREATE UNIQUE INDEX "user_medals_userWallet_medalId_key" ON "user_medals"("userWallet", "medalId");

-- CreateIndex
CREATE UNIQUE INDEX "admins_walletAddress_key" ON "admins"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "kyc_records_userWallet_key" ON "kyc_records"("userWallet");

-- CreateIndex
CREATE INDEX "credit_ledger_created_at_idx" ON "credit_ledger"("created_at");

-- CreateIndex
CREATE INDEX "credit_ledger_operation_type_idx" ON "credit_ledger"("operation_type");

-- CreateIndex
CREATE INDEX "credit_ledger_related_order_id_idx" ON "credit_ledger"("related_order_id");

-- CreateIndex
CREATE INDEX "credit_ledger_user_id_idx" ON "credit_ledger"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_orders_external_tid_key" ON "payment_orders"("external_tid");

-- CreateIndex
CREATE INDEX "payment_orders_created_at_idx" ON "payment_orders"("created_at");

-- CreateIndex
CREATE INDEX "payment_orders_status_idx" ON "payment_orders"("status");

-- CreateIndex
CREATE INDEX "payment_orders_user_id_idx" ON "payment_orders"("user_id");

-- CreateIndex
CREATE INDEX "webhook_logs_created_at_idx" ON "webhook_logs"("created_at");

-- CreateIndex
CREATE INDEX "webhook_logs_external_tid_idx" ON "webhook_logs"("external_tid");

-- CreateIndex
CREATE INDEX "webhook_logs_processed_idx" ON "webhook_logs"("processed");

-- CreateIndex
CREATE UNIQUE INDEX "investment_receipts_child_fraction_hash_key" ON "investment_receipts"("child_fraction_hash");

-- CreateIndex
CREATE INDEX "investment_receipts_investorWallet_idx" ON "investment_receipts"("investorWallet");

-- CreateIndex
CREATE INDEX "investment_receipts_assetId_idx" ON "investment_receipts"("assetId");

-- CreateIndex
CREATE INDEX "investment_receipts_status_idx" ON "investment_receipts"("status");

-- CreateIndex
CREATE INDEX "risk_acknowledgements_userWallet_idx" ON "risk_acknowledgements"("userWallet");

-- CreateIndex
CREATE INDEX "risk_acknowledgements_assetId_idx" ON "risk_acknowledgements"("assetId");

-- CreateIndex
CREATE INDEX "risk_acknowledgements_acceptedAt_idx" ON "risk_acknowledgements"("acceptedAt");

-- CreateIndex
CREATE UNIQUE INDEX "admin_permissions_walletAddress_key" ON "admin_permissions"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_walletAddress_key" ON "user_profiles"("walletAddress");

-- AddForeignKey
ALTER TABLE "user_medals" ADD CONSTRAINT "user_medals_userWallet_fkey" FOREIGN KEY ("userWallet") REFERENCES "users"("walletAddress") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_ownerWallet_fkey" FOREIGN KEY ("ownerWallet") REFERENCES "users"("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_records" ADD CONSTRAINT "kyc_records_userWallet_fkey" FOREIGN KEY ("userWallet") REFERENCES "users"("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorWallet_fkey" FOREIGN KEY ("actorWallet") REFERENCES "users"("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_ledger" ADD CONSTRAINT "credit_ledger_related_order_id_fkey" FOREIGN KEY ("related_order_id") REFERENCES "payment_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_ledger" ADD CONSTRAINT "credit_ledger_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_credits" ADD CONSTRAINT "user_credits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_logs" ADD CONSTRAINT "webhook_logs_related_order_id_fkey" FOREIGN KEY ("related_order_id") REFERENCES "payment_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_receipts" ADD CONSTRAINT "investment_receipts_investorWallet_fkey" FOREIGN KEY ("investorWallet") REFERENCES "users"("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_receipts" ADD CONSTRAINT "investment_receipts_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_acknowledgements" ADD CONSTRAINT "risk_acknowledgements_userWallet_fkey" FOREIGN KEY ("userWallet") REFERENCES "users"("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_acknowledgements" ADD CONSTRAINT "risk_acknowledgements_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_permissions" ADD CONSTRAINT "admin_permissions_walletAddress_fkey" FOREIGN KEY ("walletAddress") REFERENCES "users"("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_walletAddress_fkey" FOREIGN KEY ("walletAddress") REFERENCES "users"("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE;

