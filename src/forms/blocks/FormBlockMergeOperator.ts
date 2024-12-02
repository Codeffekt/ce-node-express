import { FormBlock } from "@codeffekt/ce-core-data";

export class FormBlockMergeOperator {


    static mergeBlocks(curBlock: FormBlock, newBlock: FormBlock): FormBlock {

        if(curBlock.type === "index") {
            return this.mergeIndexBlocks(curBlock, newBlock);
        } else {
            return this.mergeBlocksDefault(curBlock, newBlock);
        }

    }

    private static mergeIndexBlocks(curBlock: FormBlock, newBlock: FormBlock): FormBlock {
        return newBlock.value === undefined && curBlock.value !== undefined ? {
            // the current block has a subform attached to it, so we keep
            // its reference and its model type
            ...newBlock,
            value: curBlock.value,
            root: curBlock.root
        } : {
            ...newBlock
        };
    }

    private static mergeBlocksDefault(curBlock: FormBlock, newBlock: FormBlock): FormBlock {
        return {
            ...newBlock,
            // do not update the block value if already there    
            value: curBlock.value === undefined ? newBlock.value : curBlock.value
        };
    }

}