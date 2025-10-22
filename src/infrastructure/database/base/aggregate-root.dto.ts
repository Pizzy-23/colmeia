import { Exclude, Expose } from "class-transformer";
import { BaseEntityDto } from "@domain/entities/base-entity.dto";

@Exclude()
export class AggregateRootDto extends BaseEntityDto {
  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
