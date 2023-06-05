import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import chaiLike from "chai-like";
import sinonChai from "sinon-chai";

chai.use(chaiAsPromised);
chai.use(sinonChai);
chai.use(chaiLike);

chai.config.truncateThreshold = 0;
